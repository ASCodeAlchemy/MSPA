import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    options: [{
        text: {
            type: String,
            required: true
        },
        isCorrect: {
            type: Boolean,
            default: false
        }
    }],
    questionType: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'fill_in_blank'],
        default: 'multiple_choice'
    },
    correctAnswer: {
        type: String,
        trim: true,
        select: false 
    },
    marks: {
        type: Number,
        default: 1
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Question', questionSchema);