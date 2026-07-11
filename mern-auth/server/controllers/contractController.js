import { Groq } from 'groq-sdk';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import contractModel from '../models/contractModel.js';

// Initialize Groq client
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }
  return new Groq({ apiKey });
};

// System prompt for contract analysis
const ANALYSIS_SYSTEM_PROMPT = `
You are a world-class AI legal analyst specializing in contract review for startups, freelancers, and small businesses.
You must analyze the provided contract text and return a comprehensive JSON analysis.

STRICT OUTPUT FORMAT — return ONLY this JSON, no markdown, no extra text:
{
  "is_legal_document": <boolean, true if the text is a legal contract/agreement, false otherwise>,
  "summary": "<4-6 sentence plain English overview. IF is_legal_document is false, explain politely that this is not a legal document and you cannot analyze it.>",
  "contract_type": "<e.g. Service Agreement, NDA, etc. OR 'Non-Legal' if applicable>",
  "parties": ["<Party 1 name and role>", "<Party 2 name and role>"],
  "risk_score": <integer 1-10, where 10 is highest risk. Set to 0 if not a legal document.>,
  "risk_summary": "<2-3 sentence explanation of the overall risk level.>",
  "risky_clauses": [
    {
      "title": "<Short title>",
      "clause": "<Quote>",
      "severity": "<High|Medium|Low>",
      "reason": "<Explanation>"
    }
  ],
  "key_obligations": ["<Obligation>"],
  "recommendations": ["<Suggestion>"],
  "deadlines": ["<Timeline>"],
  "missing_protections": ["<Missing Clause>"],
  "favorable_clauses": ["<Fair Clause>"]
}

Rules:
- CRITICAL: If the provided text is NOT a legal contract, agreement, or document with legal implications (e.g., it is a grocery list, a story, a personal letter, math problems, code, or nonsense), you MUST set 'is_legal_document' to false and provide a polite rejection message in the 'summary' field. Set all other lists to [] and risk_score to 0.
- Provide at least 3-5 risky_clauses, 3-5 recommendations, 2-4 key_obligations, 2-4 missing_protections if it is a legal document.
- Be as specific as possible. Quote actual text from the contract where possible.
- If something is not present in the contract, write "Not specified in the contract" for that field.
- VERY IMPORTANT FOR RISK SCORE: Calculate the risk_score (1-10) dynamically based on the severity and frequency of the risky clauses found.
  * 1-3 = Low Risk (Standard, well-balanced contract with minor or no risky clauses)
  * 4-6 = Medium Risk (Slightly one-sided, missing standard protections, or containing a few medium severity risky clauses)
  * 7-10 = High Risk (Highly one-sided, draconian clauses, unlimited liability, highly unfair terms, multiple high-severity risky clauses)
- Do NOT just default to 8. Read the contract and assign an accurate score.
`;

// Helper to extract text from buffer based on mimetype
const extractTextFromBuffer = async (buffer, originalname, mimetype) => {
  const ext = originalname.toLowerCase();
  
  if (ext.endsWith('.pdf') || mimetype === 'application/pdf') {
    const parser = new PDFParse({});
    await parser.load(buffer);
    const text = await parser.getText();
    await parser.destroy();
    return text;
  } else if (ext.endsWith('.docx') || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const data = await mammoth.extractRawText({ buffer });
    return data.value;
  } else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || mimetype.startsWith('image/')) {
    // OCR via Groq Vision
    const groq = getGroqClient();
    const base64Image = buffer.toString('base64');
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are an OCR expert. Carefully read and transcribe ALL the text visible in this contract or document image. Include every word, number, clause, and signature block exactly as it appears. Return ONLY the raw transcribed text with no extra commentary."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimetype};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      temperature: 0.0,
      max_tokens: 4096
    });
    return response.choices[0].message.content.trim();
  } else {
    throw new Error("Unsupported file format. Please upload PDF, DOCX, JPG, JPEG, or PNG.");
  }
};

// ─── Controller Handlers ───────────────────────────────────────────

// 1. Upload and Analyze Contract
export const uploadAndAnalyze = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { originalname, mimetype, buffer } = req.file;
    
    // Extract text
    let extractedText = "";
    try {
      extractedText = await extractTextFromBuffer(buffer, originalname, mimetype);
    } catch (err) {
      return res.status(400).json({ success: false, message: `Text extraction failed: ${err.message}` });
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return res.status(400).json({ 
        success: false, 
        message: "No text could be extracted from the document. Please ensure it contains readable text." 
      });
    }

    // Truncate text for analysis context
    const truncatedText = extractedText.substring(0, 15000);

    // Call Groq Llama for Analysis
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: `Analyze this contract:\n\n${truncatedText}` }
      ],
      temperature: 0.15,
      response_format: { type: "json_object" },
      max_tokens: 4096
    });

    const rawResult = response.choices[0].message.content.trim();
    let analysisResult;
    try {
      analysisResult = JSON.parse(rawResult);
    } catch (err) {
      console.error("JSON Parsing Error from Groq output:", rawResult);
      return res.status(500).json({ success: false, message: "AI returned invalid JSON structure. Please try again." });
    }

    // Save to database
    const contract = new contractModel({
      userId: req.userId,
      fileName: originalname,
      extractedText: extractedText,
      analysis: analysisResult,
      chatHistory: [
        { role: "bot", content: "Contract analyzed successfully! Ask me any questions about it." }
      ]
    });

    await contract.save();

    return res.status(200).json({
      success: true,
      message: "Contract analyzed and saved successfully",
      contractId: contract._id,
      fileName: contract.fileName,
      analysis: contract.analysis,
      chatHistory: contract.chatHistory
    });

  } catch (error) {
    console.error("Upload and Analyze Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

// 2. Get User Contracts list (metadata only)
export const getUserContracts = async (req, res) => {
  try {
    const contracts = await contractModel.find({ userId: req.userId })
      .select('fileName analysis.risk_score analysis.contract_type createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      contracts
    });
  } catch (error) {
    console.error("Get User Contracts Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 3. Get Specific Contract Details
export const getContractDetails = async (req, res) => {
  try {
    const contract = await contractModel.findOne({ _id: req.params.id, userId: req.userId });
    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found" });
    }

    return res.status(200).json({
      success: true,
      contract
    });
  } catch (error) {
    console.error("Get Contract Details Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 4. Chat with Contract Context
export const chatWithContract = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    const contract = await contractModel.findOne({ _id: req.params.id, userId: req.userId });
    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found" });
    }

    // Build Context
    const analysis = contract.analysis || {};
    let analysisStr = `
AI-GENERATED CONTRACT ANALYSIS (currently visible on the user's dashboard UI):
---
- Contract Type: ${analysis.contract_type || 'Unknown'}
- Parties Involved: ${(analysis.parties || []).join(', ')}
- Risk Score: ${analysis.risk_score || '0'}/10
- Risk Summary: ${analysis.risk_summary || 'N/A'}

- Risky Clauses Found:`;

    const riskyClauses = analysis.risky_clauses || [];
    if (riskyClauses.length > 0) {
      riskyClauses.forEach((clause, i) => {
        analysisStr += `\n  * Clause ${i+1}: ${clause.title || 'Risk Clause'} (Severity: ${clause.severity || 'High'})\n    - Reason: ${clause.reason || 'N/A'}\n    - Quote: "${clause.clause || 'N/A'}"`;
      });
    } else {
      analysisStr += "\n  * None identified.";
    }

    analysisStr += `\n\n- AI Suggestions / Recommendations: ${(analysis.recommendations || []).map(r => `\n  * ${r}`).join('')}`;
    analysisStr += `\n\n- Deadlines / Key Timelines: ${(analysis.deadlines || []).map(d => `\n  * ${d}`).join('')}`;
    analysisStr += `\n\n- Key Obligations: ${(analysis.key_obligations || []).map(o => `\n  * ${o}`).join('')}`;
    analysisStr += `\n\n- Missing Protections: ${(analysis.missing_protections || []).map(m => `\n  * ${m}`).join('')}`;
    analysisStr += `\n\n- Favorable Clauses: ${(analysis.favorable_clauses || []).map(f => `\n  * ${f}`).join('')}\n---\n`;

    const truncatedContext = contract.extractedText.substring(0, 15000);

    const systemPrompt = `You are an expert AI legal assistant. A user has uploaded a legal contract and has questions about it.
Your job is to answer their questions clearly, accurately, and in plain English based on the raw contract text AND the AI-generated contract analysis findings.

If the user asks questions regarding the AI outputs shown on their screen—such as the Risk Score, Risk Clauses, AI Suggestions/Recommendations, Deadlines, Contract Summary, or Contract Details—you MUST use the AI-generated analysis below to explain and elaborate on them.

${analysisStr}

CONTRACT TEXT:
---
${truncatedContext}
---

Rules:
1. Undergo a professional, legal-expert tone. Answer clearly and in plain English.
2. If the user asks about dashboard cards (Risk Score, Risk Clauses, AI Suggestions, Deadlines), reference the AI-generated analysis.
3. If they ask about terms found in the original contract text, reference the raw CONTRACT TEXT and cite specific parts or clauses.
4. If the user asks something completely unrelated to the contract or legal queries, politely state that you can only assist with questions about this document.
5. Explain legal jargon in simple terms.
6. Format responses with bullet points, numbered lists, or bold highlights to maintain a beautiful, premium visual hierarchy.
`;

    // Map history to Groq format (role must be user or assistant)
    const messages = [{ role: "system", content: systemPrompt }];
    
    // Add last 6 messages
    const recentHistory = contract.chatHistory.slice(-8); // include bot greetings if applicable
    recentHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      } else if (msg.role === 'bot') {
        messages.push({ role: 'assistant', content: msg.content });
      }
    });

    messages.push({ role: "user", content: question });

    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      temperature: 0.3,
      max_tokens: 1024
    });

    const reply = response.choices[0].message.content.trim();

    // Save to Database
    contract.chatHistory.push({ role: 'user', content: question });
    contract.chatHistory.push({ role: 'assistant', content: reply });
    await contract.save();

    return res.status(200).json({
      success: true,
      response: reply,
      chatHistory: contract.chatHistory
    });

  } catch (error) {
    console.error("Chat with Contract Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

// 5. General Legal Chat
export const generalChat = async (req, res) => {
  try {
    const { question, history } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    const systemPrompt = `You are LegalAssist-AI, a specialized legal intelligence assistant.
Your goal is to answer questions strictly related to legal matters, law, regulations, and legal concepts.

Rules:
1. ONLY answer questions that are legal in nature.
2. If a user asks a non-legal question (e.g., general knowledge, math, coding, life advice), politely decline and state: "I am a specialized legal assistant and can only help with legal-related queries. For this topic, you may want to consult other specialized sources or search engines."
3. Be clear, professional, and accurate.
4. Always include this disclaimer at the end: "Disclaimer: I am an AI, not an attorney. This information is for educational purposes only and does not constitute legal advice."
5. Format responses with bullet points for readability.
`;

    const messages = [{ role: "system", content: systemPrompt }];
    
    // Add history
    if (history && Array.isArray(history)) {
      history.slice(-6).forEach(msg => {
        messages.push({
          role: msg.role === 'assistant' || msg.role === 'bot' ? 'assistant' : 'user',
          content: msg.content
        });
      });
    }

    messages.push({ role: "user", content: question });

    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      temperature: 0.5,
      max_tokens: 1024
    });

    const reply = response.choices[0].message.content.trim();

    return res.status(200).json({
      success: true,
      response: reply
    });

  } catch (error) {
    console.error("General Chat Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

// 6. Delete Contract
export const deleteContract = async (req, res) => {
  try {
    const contract = await contractModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Contract deleted successfully"
    });
  } catch (error) {
    console.error("Delete Contract Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
