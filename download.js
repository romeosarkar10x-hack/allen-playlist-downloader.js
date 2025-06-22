import fs from "fs/promises";
import http from "http";

async function download(url, headers) {
    const res = await fetch(url, {
        headers,
    });

    return await res.bytes();
}

(async function main() {
    const bytes = await download(
        "https://content.allen.in/1efdbdce-21d4-4814-8cd1-c071dd4c0850/transcodedVideos/ALLEN/transcoded_video_x264_5000k_HD?hdnts=exp=1750542012~acl=*1efdbdce-21d4-4814-8cd1-c071dd4c0850*~hmac=3b8b325650a6ac63ce14224939f72e01553aa3dc1a508bcdc22de18434b706ae",
    );

    await fs.writeFile("video.mp4", bytes);
})();
