const mongoose= require('mongoose');
const Schema=mongoose.Schema;

const NotificationSchema=new Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    targetRoles: {
      type: [String],
      default: []
    },
    targetBranches: {
      type: [String],
      default: []
    },
    targetBatchYears: {
      type: [Number],
      default: []
    }
},{timestamps:true});

NotificationSchema.index({ createdAt: -1 })
NotificationSchema.index({ targetRoles: 1, targetBranches: 1, targetBatchYears: 1 })

module.exports=mongoose.model('Notification',NotificationSchema);

