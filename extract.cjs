const fs = require('fs');
const readline = require('readline');
const path = 'C:\\Users\\hahoa\\.gemini\\antigravity-ide\\brain\\4efd3282-dd2f-42ed-9424-43d4161ea360\\.system_generated\\logs\\transcript.jsonl';

async function extract() {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let found = false;
    for await (const line of rl) {
        if (line.includes('Thêm vào giỏ món') && line.includes('showCheckoutModal')) {
            const data = JSON.parse(line);
            if (data.type === 'ACTION_RESULT' || data.type === 'OBSERVATION') {
                console.log("FOUND!");
                console.log(data.content || data.output || JSON.stringify(data).substring(0, 500));
                
                // Let's just output the content to a temp file
                if (data.content) fs.writeFileSync('temp_extracted.txt', data.content);
                else if (data.output) fs.writeFileSync('temp_extracted.txt', data.output);
                found = true;
                break;
            }
        }
    }
    if (!found) console.log("Not found in transcript");
}
extract();
