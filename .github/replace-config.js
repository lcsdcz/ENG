module.exports = {
  files: 'js/config.js',
  from: [
    '{{OPENAI_API_KEY}}',
    '{{OPENAI_API_URL}}',
    '{{OPENAI_MODEL}}'
  ],
  to: [
    process.env.OPENAI_API_KEY || '{{OPENAI_API_KEY}}',
    process.env.OPENAI_API_URL || '{{OPENAI_API_URL}}',
    process.env.OPENAI_MODEL || '{{OPENAI_MODEL}}'
  ]
};
