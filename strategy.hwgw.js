/**
 * @typedef {import(".").NS} ns
 * @typedef {import("./phoenix-doc").PlayerObject} PlayerObject
 * @typedef {import("./phoenix-doc").ServerObject} ServerObject
 *
 */

import Default from "./strategy.base";
import { semaphores } from "./strategy.base";
import PrettyTable from "./src.prettytable";
export default class hwgw extends Default {
    constructor() {
        super();
        this.files = [
            {
                path: "bin.hk.futureloop.js",
                ram: 1.75,
                ratio: 0
            },
            {
                path: "bin.gr.futureloop.js",
                ram: 1.8,
                ratio: 0
            },
            {
                path: "bin.wk.futureloop.js",
                ram: 1.8,
                ratio: 0
            }
        ];
        this.stagger = 1;
    }

    disqualify_attacker(s) {
        return (s.ram.free < 128);
    }

    disqualify_target(t) {
        return (t.money.max > t.money.available || t.security.level > t.security.min);
    }

    filter_targets() {
        let priorities = new Map();

        priorities.set(10, (t => t.hackTime < 60));
        priorities.set(16, (t => (t.id == "n00dles")));

        return priorities;
        
    }


    prepare_package(a, targets) {
        var bundles = [];
        var remaining_ram = a.ram.free;
        var target = this.priorityQueue.poll();

        while (target && remaining_ram > 0) {
            var percentage_hacked = 0.20;
            var hackThreads = 0;
            var growThreads = 0;
            var weakThreads1 = 0;
            var weakThreads2 = 0;
            var sec1;
            var sec2;

            var hackTime = target.hackTime;
            var growTime = hackTime * 3.2;
            var weakenTime = hackTime * 4;

            hackThreads = globalThis.ns.hackAnalyzeThreads(target.id, (target.money.max * percentage_hacked));
            growThreads = globalThis.ns.growthAnalyze(target.id, 1 / percentage_hacked);
    
            sec1 = hackThreads * 0.002;
            sec2 = growThreads * 0.004;
            weakThreads1 = sec1 / 0.05;
            weakThreads2 = sec2 / 0.05;

            var nextlaunchdate = new Date().valueOf() + Math.max(2000, weakenTime * 1.1);

            hackThreads  = Math.floor(hackThreads);
            growThreads  = Math.ceil(growThreads);
            weakThreads1 = Math.ceil(weakThreads1);
            weakThreads2 = Math.ceil(weakThreads2);
            
            this.memory_req = (hackThreads * 1.75) + ((growThreads + weakThreads1 + weakThreads2) * 1.8);

            if (remaining_ram >= this.memory_req) {
                let suggested_bundle = [];

                suggested_bundle.push({
                    file: "bin.hk.futureloop.js",
                    attacker: a.id,
                    threads: hackThreads,
                    args: [target.id, nextlaunchdate]
                });

                suggested_bundle.push({
                    file: "bin.wk.futureloop.js",
                    attacker: a.id,
                    threads: weakThreads1,
                    args: [target.id, nextlaunchdate+25]
                });

                suggested_bundle.push({
                    file: "bin.gr.futureloop.js",
                    attacker: a.id,
                    threads: growThreads,
                    args: [target.id, nextlaunchdate+50]
                });

                suggested_bundle.push({
                    file: "bin.wk.futureloop.js",
                    attacker: a.id,
                    threads: weakThreads2,
                    args: [target.id, nextlaunchdate+75]
                });

                if (suggested_bundle.length == 4 &&
                    suggested_bundle.every(b => b.threads > 0) &&
                    suggested_bundle.every(b => typeof b.attacker === "string")) {
                    bundles.push(...suggested_bundle.map(b => JSON.stringify(b)));
                    remaining_ram -= this.memory_req;
                } else {
                    // ns.tprint("Couldn't push bundle: ",
                    // (suggested_bundle.length == 4)," ",
                    // (this.memory_req <= remaining_ram), " ",
                    // suggested_bundle.every(b => b.threads > 0)," ", suggested_bundle.map(b => b.threads),
                    // suggested_bundle.every(b => typeof b.attacker === "string")," ",
                    // );

                }

            }
            target = this.priorityQueue.poll();
        }
        return bundles;
    }


    iterate(servers, attackers, bootstrapped, targets, filtered, executions, pids) {
        if (ns.read("var.debug.txt")) {} else {


            let pt = new PrettyTable();
            let headers = ["Under 100%", "At 100%"];
            let rows = [];
            for (let i = 0; i < targets.length; i++) {
                rows.push([
                    servers.filter(t => t.targeted_by.length > 0 && t.money.available / t.money.max < 1 ).map(t => t.id)[i] || "",
                    targets.filter(t => t.money.available / t.money.max >= 1).map(t => t.id)[i] || "",
                ]);
            }
            
            pt.create(headers, rows);
            globalThis.ns.clearLog();
            globalThis.ns.print(pt.print());
        }

        return {servers, attackers, bootstrapped, targets, filtered, executions, pids};
    }

}