/**
 * Email template utilities using Handlebars
 */

import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

/**
 * Render a Handlebars email template
 * @param {string} templateName - Name of the template file (without extension)
 * @param {Object} context - Data to inject into the template
 * @returns {Promise<string>} Rendered HTML string
 */
export async function renderEmailTemplate(templateName, context) {
    const templatePath = path.join(process.cwd(), 'src', 'email', 'templates', `${templateName}.hbs`);
    const source = await fs.readFile(templatePath, 'utf8');
    const template = handlebars.compile(source);
    return template(context);
}