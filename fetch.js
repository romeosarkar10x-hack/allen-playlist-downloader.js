const url = "https://api.allen-live.in/api/v1/pages/getPage";

const batch_id = ["bt_B8pZxUP9RdEsaiKZNddiH"];

const selected_batch_list = ["bt_B8pZxUP9RdEsaiKZNddiH"];

const selected_course_id = "course_bxMhJk4o1MGkEp3CKKAad";

const stream = "STREAM_JEE_MAIN_ADVANCED";
const subject_id = "354"; // 152 for Maths, 2 for Chemistry
const taxonomy_id = "1699072624yb";

const params = new URLSearchParams();

params.append("batch_id", batch_id.join(","));
params.append("selected_batch_list", selected_batch_list.join(","));
params.append("selected_course_id", selected_course_id);
params.append("stream", stream);
params.append("subject_id", subject_id);
params.append("taxonomy_id", taxonomy_id);

const body = JSON.stringify({
    page_url: `/subject-details?${params.toString()}`,
});

const headers = {
    "Authorization":
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhVVNzVzhHSTAzZHlRMEFJRlZuOTIiLCJkX3R5cGUiOiJ3ZWIiLCJkaWQiOiI0MmMzMWJjMS0wMGY1LTQ4MDctYTM4Mi05ZmZiYTBkYTJmYjQiLCJlX2lkIjoiOTU4NTc3NTYyIiwiZXhwIjoxNzUwMzU2MzE0LCJpYXQiOiIyMDI1LTA2LTE4VDE2OjA1OjE0LjQxOTEzNzM2MloiLCJpc3MiOiJhdXRoZW50aWNhdGlvbi5hbGxlbi1wcm9kIiwiaXN1IjoiZmFsc2UiLCJwdCI6IlNUVURFTlQiLCJzaWQiOiJlZWEyMmMyOS0yOTUwLTQ5ZmQtYTJhMS0wMTU0MzQ5MGU1MWQiLCJ0aWQiOiJhVVNzVzhHSTAzZHlRMEFJRlZuOTIiLCJ0eXBlIjoiYWNjZXNzIiwidWlkIjoicHVQaHd1UTRkc05vWTI3bHJPaHZZIn0.avoBMSfAVKfOGfJ73H0G9BD9wUWPOAot2BTbjZ-taK8",
    "X-Client-Type": "web",
    "X-Locale": "en",
    "X-Selected-Batch-List": params.get("selected_batch_list"),
    "X-Selected-Course-Id": params.get("selected_course_id"),
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
};

console.log("headers:", headers);
console.log("body:", body);

async function getChapterContents(chapter) {
    const newParams = new URLSearchParams(params);
    newParams.append("topic_id", chapter.topic_id);
    const body = JSON.stringify({
        page_url: `/topic-content?${newParams.toString()}`,
    });

    const res = await fetch(url, {
        headers,
        method: "POST",
        body,
    });

    const resObj = await res.json();
    const widgets = resObj.data.tab_data[0].tab_info.page_data.page_content.widgets.map(widget => {
        return { title: widget.data.title, cards: widget.data.cards };
    });

    const widgetsFiltered = widgets.map(widget =>
        widget.cards.map(card => {
            return {
                title: card.action.data.title,
                url: card.action.data.uri,
            };
        }),
    );

    console.log(JSON.stringify(widgetsFiltered));
}

(async function main() {
    const res = await fetch(url, {
        headers,
        method: "POST",
        body,
    });

    const resObj = await res.json();
    const list = resObj.data.tab_data[0].tab_info.page_data.page_content.widgets[1].data.list.map(e => {
        return { title: e.title, cards: e.cards };
    });
    const modules = list.map(chapters =>
        chapters.cards.map(chapter => {
            return {
                title: chapter.title,
                topic_id: chapter.action.data.query.topic_id,
            };
        }),
    );

    console.log(JSON.stringify(modules));

    let x = false;
    modules.forEach(module => {
        module.forEach(chapter => {
            if (!x) {
                x = true;
                getChapterContents(chapter);
            }
        });
    });
})();
