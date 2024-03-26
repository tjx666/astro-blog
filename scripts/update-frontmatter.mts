import fs from 'node:fs/promises';
import path from 'node:path';

import removeMd from 'remove-markdown';

function updateFrontmatter(content: string) {
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

    const titleRegexp = /(\btitle: )[\s\S]+?\n/;
    const descRegexp = /(\bdescription: )[\s\S]+?\n/;
    // update description
    // TODO: 使用 AIGC 生成
    const descMatch = updateContent.match(descRegexp);
    if (!descMatch) {
        const lines = updateContent.split('\n');
        let frontmatterEndIndex = 0;
        for (const [index, line] of lines.entries()) {
            if (index !== 0 && line === '---') {
                frontmatterEndIndex = index;
                break;
            }
        }
        let md = lines
            .slice(frontmatterEndIndex + 1)
            .filter((line) => !line.startsWith('## '))
            .join('\n');
        md = md.slice(0, md.indexOf('\n\n')).slice(0, 300);
        const description = removeMd(md).trim().slice(0, 100);
        if (description.length > 60) {
            updateContent = updateContent.replace(titleRegexp, `$&description: ${description}\n`);
        }
    }

    return updateContent;
}

async function main() {
    let blogFileNames = process.argv.slice(2);
    const projectRoot = path.resolve(import.meta.dirname, '..');
    if (blogFileNames.length === 0) {
        const blogDir = 'src/content/blog';
        blogFileNames = (await fs.readdir(path.resolve(projectRoot, blogDir))).map(
            (fileName) => `${blogDir}/${fileName}`,
        );
    }

    const promises = blogFileNames.map(async (fileName) => {
        const filePath = path.resolve(projectRoot, fileName);
        const content = await fs.readFile(filePath, 'utf8');
        const updatedContent = updateFrontmatter(content);
        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent, 'utf8');
        }
    });
    await Promise.all(promises);
}

main();
