import fs from 'node:fs/promises';
import path from 'node:path';

function updateFrontmatterDatetime(content: string) {
    let updateContent = content;
    const pubRegexp = /(\bpubDatetime: )[\s\S]+?\n/;
    const modRegexp = /(\bmodDatetime: )[\s\S]+?\n/;

    // update modDatetime
    const modMatch = content.match(modRegexp);
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const modDatetime = `${today.getFullYear()}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    if (modMatch) {
        updateContent = updateContent.replace(modRegexp, `$1${modDatetime}\n`);
    } else {
        // modDatetime put after pubDatetime
        updateContent = updateContent.replace(pubRegexp, `$&modDatetime: ${modDatetime}\n`);
    }

    // update pubDatetime
    const isDraft = updateContent.includes('\ndraft: true\n');
    if (isDraft) {
        updateContent = updateContent.replace(pubRegexp, `$1${modDatetime}\n`);
    }

    return updateContent;
}

async function main() {
    const blogFileNames = process.argv.slice(2);
    const promises = blogFileNames.map(async (fileName) => {
        const filePath = path.resolve(import.meta.dirname, '..', fileName);
        const content = await fs.readFile(filePath, 'utf8');
        const updatedContent = updateFrontmatterDatetime(content);
        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent, 'utf8');
        }
    });
    await Promise.all(promises);
}

main();
