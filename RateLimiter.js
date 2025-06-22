import https from "https";
import fs from "fs/promises";
import crypto from "crypto";

class RateLimiter {
    constructor(nConcurrentRequests, eventHandler) {
        this.nConcurrentRequests = nConcurrentRequests || 10;
        this.eventHandler = eventHandler;
        this.pendingRequests = new Map();
        this.ongoingRequests = new Map();
        this.finishedRequests = new Map();
        this.requests = new Map();
        this.requestCount = 0;
        this.httpsAgent = new https.Agent({ keepAlive: true });
        this.promises = new Map();
    }

    setEventHandler(eventHandler) {
        this.eventHandler = eventHandler;
    }

    _createPromise(reqID) {
        const obj = {};

        obj.promise = new Promise(function executor(resolve, reject) {
            obj.resolve = resolve;
            obj.reject = reject;
        });

        this.promises.set(reqID, obj);
    }

    async _startRequest(reqID) {
        const self = this;

        if (this.pendingRequests.size === 0) {
            return;
        }

        if (reqID == null) {
            reqID = self.pendingRequests.keys().next().value;
        }

        console.log("Start reqID:", reqID, "||", this.requests.get(reqID).count);

        const obj = this.pendingRequests.get(reqID);
        this.ongoingRequests.set(reqID, obj);
        this.pendingRequests.delete(reqID);

        obj.isActive = true;
        obj.res = {};

        let saveToFile = true;

        if (obj.fileOptions == null || obj.fileOptions.pathname == null) {
            saveToFile = false;
        }

        if (saveToFile) {
            obj.res.fileHandle = await fs.open(obj.fileOptions.pathname, "w");
        } else {
            obj.res.buffers = [];
        }

        const httpsURL = new URL(obj.url);

        obj.req = https.request({
            hostname: httpsURL.hostname,
            port: httpsURL.port,
            path: httpsURL.pathname + httpsURL.search,
            agent: self.httpsAgent,
            method: obj.options.method,
            headers: {
                ...obj.options.headers,
                "Content-Length": obj.options.body ? Buffer.byteLength(obj.options.body) : 0,
            },
        });

        if (obj.options.body) {
            obj.req.write(obj.options.body);
        }

        obj.req.on("response", res => {
            obj.res.headers = res.headers;
            console.log(res.headers);

            obj.eventHandler && obj.eventHandler("response", obj);
            self.eventHandler && self.eventHandler("response", obj);

            obj.res.stats = {
                totalDataReceivedInBytes: 0,
            };

            if (res.headers["content-length"]) {
                obj.res.stats.contentLengthInBytes = res.headers["content-length"];
            }

            res.on("error", function onError() {});

            res.on("data", function onDataReceived(chunk) {
                obj.res.stats.totalDataReceivedInBytes += chunk.length;

                if (saveToFile) {
                    obj.res.fileHandle.writeFile(chunk);
                } else {
                    obj.res.buffers.push(chunk);
                }

                obj.eventHandler && obj.eventHandler("data", obj);
                self.eventHandler && self.eventHandler("data", obj);
            });

            res.on("end", function onEnd() {
                obj.eventHandler && obj.eventHandler("end", obj);
                self.eventHandler && self.eventHandler("end", obj);

                self.finishedRequests.set(reqID, obj);
                self.ongoingRequests.delete(reqID);

                if (saveToFile) {
                    obj.res.fileHandle.close();
                } else {
                    obj.res.buffer = Buffer.concat(obj.res.buffers);
                }

                self.promises.get(reqID).resolve(obj.res);

                console.log("End reqID:", reqID, "||", self.requests.get(reqID).count);
                self._startRequest();
            });
        });

        obj.req.end();
    }

    request(url, options, fileOptions, reqID, eventHandler) {
        if (reqID == null) {
            reqID = crypto.randomUUID();
        }

        this.requests.set(reqID, {
            reqID,
            count: ++this.requestCount,
            isActive: false,
            options,
            fileOptions,
            url,
            eventHandler,
        });

        this._createPromise(reqID);

        this.pendingRequests.set(reqID, this.requests.get(reqID));

        if (this.ongoingRequests.size < this.nConcurrentRequests) {
            this._startRequest(reqID);
        }

        return reqID;
    }

    get(reqID) {
        return this.requests.get(reqID);
    }

    async getResponse(reqID) {
        return this.promises.get(reqID).promise;
    }

    async done() {
        while (this.pendingRequests.size) {
            await this.get(this.ongoingRequests.keys().next().value);
        }
    }
}

export default RateLimiter;
