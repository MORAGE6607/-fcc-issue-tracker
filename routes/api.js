'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define Issue Schema
const issueSchema = new Schema({
  project: { type: String },
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },
  created_by: { type: String, required: true },
  assigned_to: { type: String, default: '' },
  status_text: { type: String, default: '' },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now },
  open: { type: Boolean, default: true }
});

const Issue = mongoose.model('Issue', issueSchema);

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(async function (req, res) {
      const project = req.params.project;
      const query = req.query;

      try {
        const issues = await Issue.find({ project, ...query }).exec();
        return res.json(issues);
      } catch (err) {
        return res.json({ error: 'could not fetch issues' });
      }
    })
    
    .post(async function (req, res) {
      const project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      try {
        const newIssue = new Issue({
          project,
          issue_title,
          issue_text,
          created_by,
          assigned_to: assigned_to || '',
          status_text: status_text || ''
        });

        const savedIssue = await newIssue.save();
        res.json(savedIssue);
      } catch (err) {
        res.json({ error: 'could not create issue' });
      }
    })
    
    .put(async function (req, res) {
      const project = req.params.project;
      const { _id, ...fieldsToUpdate } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.json({ error: 'no update field(s) sent', '_id': _id });
      }

      try {
        const updatedFields = { ...fieldsToUpdate, updated_on: new Date() };
        const updatedIssue = await Issue.findOneAndUpdate(
          { _id, project },
          updatedFields,
          { new: true }
        );

        if (!updatedIssue) {
          return res.json({ error: 'could not update', '_id': _id });
        }

        res.json({ result: 'successfully updated', '_id': _id });
      } catch (err) {
        res.json({ error: 'could not update', '_id': _id });
      }
    })
    
    .delete(async function (req, res) {
      const project = req.params.project;
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      try {
        const deletedIssue = await Issue.findOneAndDelete({ _id, project });

        if (!deletedIssue) {
          return res.json({ error: 'could not delete', '_id': _id });
        }

        res.json({ result: 'successfully deleted', '_id': _id });
      } catch (err) {
        res.json({ error: 'could not delete', '_id': _id });
      }
    });
};
