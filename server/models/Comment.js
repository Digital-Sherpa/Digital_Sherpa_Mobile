import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  journeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Journey",
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
    maxlength: 500,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

commentSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

commentSchema.index({ journeyId: 1, createdAt: -1 });

export default mongoose.model("Comment", commentSchema);
