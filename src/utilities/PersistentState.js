import fs from "fs/promises";
import AsyncFileWriter from "./AsyncFileWriter.js";

class PersistentState {
    constructor(pathname, resolver) {
        this.pathname = pathname;
        this.promises = [];

        const self = this;

        async function initialize() {
            try {
                let data;

                try {
                    data = await fs.readFile(pathname);
                } catch (err) {
                    console.log(`Failed to read file \`${pathname}\` [ ${err.message} ]`);
                    throw err;
                }

                try {
                    self.state = JSON.parse(data);
                    console.log("Restored state:", self.state);
                } catch (err) {
                    console.log(`Failed to parse file \`${pathname}\` [ ${err.message} ]`);
                    throw err;
                }
            } catch (err) {
                console.log(`Error restoring state from file \`${pathname}\``);
                // self.state = defaultStateObj;
                self.state = await resolver();
            }

            try {
                self.file = await fs.open(pathname, "w");
            } catch (err) {
                console.log(`Error opening file \`${pathname}\` for writing`);
            }
        }

        this.initialize = initialize();
    }

    async getStateObj() {
        await this.initialize;
        return this.state;
    }

    async _write(obj, awaitFor) {
        if (awaitFor != null) {
            await awaitFor;
            await this.file.truncate(0);
        }

        await this.file.write(JSON.stringify(obj), 0);
    }

    async setStateObj(obj) {
        await this.initialize;
        this.state = obj;

        if (this.file == null) {
            console.log("Error saving `state` to file; File is not open for writing");
            throw Error("File is not open for writing");
        }

        try {
            this.promises.push(this._write(obj, this.promises.at(-1)));
            await this.promises.at(-1);
        } catch (err) {
            console.log("Error settings state");
            throw err;
        }
    }
}

const obj = { message: "Hello world!", date: new Date().toLocaleString(), count: 2 };
const persistentState = new PersistentState("obj");

persistentState.setStateObj(obj);
persistentState.setStateObj({ message: "Hello gadha!" });
persistentState.setStateObj({ count: 8 });
persistentState.setStateObj({ count: 9 });
persistentState.setStateObj({ count: 10 });
persistentState.setStateObj({ count: 11 });
persistentState.setStateObj({ count: 12 });
persistentState.setStateObj(obj);
persistentState.setStateObj({ count: 13 });
persistentState.setStateObj({ count: 14 });

persistentState.setStateObj({ count: 15 });

export default PersistentState;
