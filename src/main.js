import fs from "fs";
import { outputCourseMapPathname, selectedCourseID } from "./config.js";
import getCourseContents from "./getCourseContents.js";
import filter from "./filter.js";
import recurse from "./recurse.js";
import download from "./download.js";
import PersistentState from "./utilities/PersistentState.js";

// const course = new PersistentState;

(async function main() {
    const course = new PersistentState(`out/${selectedCourseID}.json`, async () => {
        return await getCourseContents();
    });

    filter(course);

    fs.writeFileSync(outputCourseMapPathname, recurse(course), "utf8");
    //     download(course);
})();
