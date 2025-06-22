import "dotenv/config";
import fs from "fs";
import recurse from "./recurse.js";

const url = "https://api.allen-live.in/api/v1/pages/getPage";
const batch_id = ["bt_B8pZxUP9RdEsaiKZNddiH"];
const selected_batch_list = ["bt_B8pZxUP9RdEsaiKZNddiH"];
const selected_course_id = "course_bxMhJk4o1MGkEp3CKKAad";
const stream = "STREAM_JEE_MAIN_ADVANCED";
const taxonomy_id = "1699072624yb";

// const subject_id = "2"; // 354 for Physics, 152 for Maths, 2 for Chemistry

const commonParams = new URLSearchParams();

commonParams.append("batch_id", batch_id.join(","));
commonParams.append("selected_batch_list", selected_batch_list.join(","));
commonParams.append("selected_course_id", selected_course_id);
commonParams.append("stream", stream);
commonParams.append("taxonomy_id", taxonomy_id);

const headers = {
    "Authorization": "Bearer " + process.env.AUTHORIZATION,
    "X-Client-Type": "web",
    "X-Locale": "en",
    "X-Selected-Batch-List": commonParams.get("selected_batch_list"),
    "X-Selected-Course-Id": commonParams.get("selected_course_id"),
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
};

async function getChapterContents({ topicID, subjectID }) {
    const params = new URLSearchParams(commonParams);
    params.append("topic_id", topicID);
    params.append("subject_id", subjectID);

    const body = JSON.stringify({
        page_url: `/topic-content?${params.toString()}`,
    });

    // console.log(body, headers);

    const res = await fetch(url, {
        headers,
        method: "POST",
        body,
    });

    const obj = await res.json();
    // console.log(JSON.stringify(obj, null, 2));
    // const widgets = obj.data.tab_data[0].tab_info.page_data.page_content.widgets;

    const module = obj.data.tab_data[0].tab_info.page_data.page_content.widgets[0].data.cards;
    // const module = { title: widget.data.title, cards: widget.data.cards };

    if (module == null) {
        return [];
    }

    return module.map(card => {
        return {
            title: card.action.data.title,
            uri: card.action.data.uri,
        };
    });
    // console.log("module:", module);

    /*
    const chaptersFiltered = chapters.map(chapter =>
        chapter.cards.map    );

    console.log("widgetsFiltered:", widgetsFiltered);
    return widgetsFiltered;
    */
    // return module;
}

async function getSubjectContents(subjectID) {
    const params = new URLSearchParams(commonParams);
    params.append("subject_id", subjectID);

    const body = JSON.stringify({
        page_url: `/subject-details?${params.toString()}`,
    });
    const res = await fetch(url, {
        headers,
        method: "POST",
        body,
    });

    const obj = await res.json();

    const list = obj.data.tab_data[0].tab_info.page_data.page_content.widgets[1].data.list.map(e => {
        return { title: e.title, cards: e.cards };
    });

    const modules = list.map(chapters => {
        return {
            title: chapters.title,
            cards: chapters.cards.map(chapter => {
                return {
                    title: chapter.title,
                    topicID: chapter.action.data.query.topic_id,
                    subjectID,
                };
            }),
        };
    });

    // console.log(JSON.stringify(modules, null, 2));
    // console.log(list);

    const promises = [];

    modules.forEach(({ cards }) => {
        cards.forEach(chapter => {
            promises.push(getChapterContents(chapter));
            chapter.cards = promises.length - 1;
        });
    });

    const promisesResolved = await Promise.all(promises);
    modules.forEach(({ cards }) => {
        cards.forEach(chapter => {
            chapter.cards = promisesResolved[chapter.cards];
        });
    });

    return modules;
}

(async function main() {
    const subjects = [
        { title: "Physics", subjectID: "354" },
        { title: "Chemistry", subjectID: "2" },
        { title: "Mathematics", subjectID: "152" },
    ];
    // const subjects = [{ title: "Chemistry", subjectID: "2" }];

    const promises = [];

    subjects.forEach(subject => {
        promises.push(getSubjectContents(subject.subjectID));
        subject.cards = promises.length - 1;
    });

    const resolvedPromises = await Promise.all(promises);
    subjects.forEach(subject => (subject.cards = resolvedPromises[subject.cards]));

    const course = { title: selected_course_id, cards: subjects };

    {
        // Filter out optional videos
        let removedCount = 0;
        function filter(obj) {
            // console.log(obj);
            if (obj.cards) {
                for (let i = 0; i < obj.cards.length; ) {
                    if (filter(obj.cards[i])) {
                        obj.cards.splice(i, 1);
                        removedCount++;
                        continue;
                    }

                    i++;
                }

                return;
            }

            return /^\(Optional\)/.test(obj.title);
        }

        filter(course);
        console.log(`Removed ${removedCount} \`(Optional)\` courses.`);
    }

    fs.writeFileSync(`${course.title}.txt`, recurse(course), "utf8");
})();
