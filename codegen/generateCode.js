const fs = require('fs');
const mustache = require('mustache');
const yaml = require('js-yaml');
const path = require('path')

const yamlParameters = fs.readFileSync(path.resolve(__dirname, './hiearchies.yaml'), 'utf8');
const parsedYaml = yaml.load(yamlParameters);
const mustacheTemplate = fs.readFileSync(path.resolve(__dirname, './template.mustache'), 'utf8');
const generatedCode = mustache.render(mustacheTemplate, parsedYaml);
fs.writeFileSync('mockData/generatedCode.js', generatedCode);

console.log('Generated TypeScript code has been saved to generatedCode.ts');
