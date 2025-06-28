import fs from "fs";
import { outputCourseDirPathname } from "./config.js";
import { rateLimiter } from "./globals.js";

const metadataFilePathname = `${outputCourseDirPathname}/metadata.json`;
let downloads = new Map();

try {
    fs.accessSync(metadataFilePathname, fs.constants.F_OK);
    const metadata = fs.readFileSync(metadataFilePathname, "utf-8");

    const obj = JSON.parse(metadata);

    for (let key in obj) {
        downloads.set(key, obj[key]);
    }
} catch (err) {
    console.log(err);
}

function saveMetadata() {
    const obj = {};

    downloads.forEach((value, key) => {
        obj[key] = value;
    });

    const metadata = JSON.stringify(obj);
    fs.writeFileSync(metadataFilePathname, metadata, "utf8");
}

function callbackOnDownloadCompleted(event, obj) {
    if (event == "end") {
        // console.log("callbackOnDownloadCompleted", obj);
        console.log(`Downloaded \`${obj.reqID}\`!`);
        downloads.set(obj.reqID, true);
        saveMetadata();
    }
}

export default function download(course) {
    function downloadRecursively(node, pathname) {
        try {
            if (!fs.existsSync(pathname)) {
                fs.mkdirSync(pathname);
            }
        } catch (err) {
            console.log(err);
            return;
        }

        if (node.cards) {
            node.cards.forEach(card => {
                downloadRecursively(card, pathname + "/" + node.title);
            });
            return;
        }

        const filePathname = pathname + "/" + node.title + ".mp4";

        if (!downloads.has(filePathname)) {
            rateLimiter.request(
                node.uri,
                null,
                {
                    pathname: filePathname,
                },
                filePathname,
                callbackOnDownloadCompleted,
            );
        } else {
            console.log(`\`${filePathname}\` skipped!`);
        }
    }

    downloadRecursively(course, outputCourseDirPathname);
}
