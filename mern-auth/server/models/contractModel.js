import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  analysis: {
    is_legal_document: { type: Boolean, default: true },
    summary: { type: String, default: "" },
    contract_type: { type: String, default: "Unknown" },
    parties: [{ type: String }],
    risk_score: { type: Number, default: 0 },
    risk_summary: { type: String, default: "" },
    risky_clauses: [{
      title: { type: String },
      clause: { type: String },
      severity: { type: String },
      reason: { type: String }
    }],
    key_obligations: [{ type: String }],
    recommendations: [{ type: String }],
    deadlines: [{ type: String }],
    missing_protections: [{ type: String }],
    favorable_clauses: [{ type: String }]
  },
  chatHistory: [{
    role: { type: String, enum: ['user', 'assistant', 'bot'] },
    content: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const contractModel = mongoose.models.Contract || mongoose.model('Contract', contractSchema);
export default contractModel;
