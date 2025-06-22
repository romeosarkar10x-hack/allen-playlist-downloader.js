import https from "https";
import url from "node:url";
import fs from "node:fs/promises";

const httpsAgent = new https.Agent({ keepAlive: true });
const httpsURL = new url.URL(
    "https://content.allen.in/cf297dd1-5bf2-4ba8-afe8-77f9c3718ffd/transcodedVideos/ALLEN/transcoded_video_x264_5000k_HD?hdnts=exp=1750575522~acl=*cf297dd1-5bf2-4ba8-afe8-77f9c3718ffd*~hmac=b07268d2af5717194615ce815a41abfe5ac915bdbfcf5438319abf37025e19e1",
);
console.log(httpsURL.searchParams);

const requestID = "xyz";

const req = https.request({
    hostname: httpsURL.hostname,
    port: httpsURL.port,
    path: httpsURL.pathname + httpsURL.search,
    agent: httpsAgent,

    method: "GET",

    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
});

req.on("response", async function (res) {
    console.log(res.statusCode);
    console.log(res.headers);

    const contentLengthInBytes = res.headers["content-length"];
    console.log("Content-Length:", contentLengthInBytes, "Bytes");

    let totalDataReceivedInBytes = 0;
    let error = "";
    let lastPercentage = 0;

    const fileHandle = await fs.open("res", "w");

    res.on("error", function onError(err) {
        console.log("ERROR", err);
    });

    res.on("data", function onDataReceived(chunk) {
        totalDataReceivedInBytes += chunk.length;
        const percentage = Math.round((totalDataReceivedInBytes / contentLengthInBytes) * 100);

        if (percentage == lastPercentage + 1) {
            process.stdout.write(`\x1b[K\x1b7@${percentage}%\x1b8`);
            lastPercentage = percentage;
        }

        fileHandle.writeFile(chunk);
    });

    res.on("end", function onEnd() {
        console.log("this is the end!");
    });

    res.on("close", function onClose() {
        console.log("close");
        fileHandle.close();
    });
});

req.end();
