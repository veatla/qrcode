import { hasOwn } from "./utils";

type PriorityQueueItem = {
    value: string;
    cost: number;
};

class PriorityQueue {
    private queue: Array<PriorityQueueItem> = [];

    constructor(sorter?: (a: PriorityQueueItem, b: PriorityQueueItem) => number) {
        if (sorter) this.sorter = sorter;
    }

    sorter(a: PriorityQueueItem, b: PriorityQueueItem): number {
        return a.cost - b.cost;
    }

    push(value: string, cost: number): void {
        const item: PriorityQueueItem = { cost, value };
        this.queue.push(item);
        this.queue.sort(this.sorter);
    }

    pop(): PriorityQueueItem | undefined {
        return this.queue.shift();
    }

    empty(): boolean {
        return this.queue.length === 0;
    }
}

class Dijkstra {
    constructor() {
        this.singleSourceShortestPaths = this.singleSourceShortestPaths.bind(this);
        this.findPath = this.findPath.bind(this);
    }

    singleSourceShortestPaths(graph: Record<string, Record<string, number>>, start: string, destination?: string) {
        const predecessor: Record<string, string> = {};

        const costs: Record<string, number> = {};
        costs[start] = 0;

        const open = new PriorityQueue();
        open.push(start, 0);

        while (!open.empty()) {
            const closest = open.pop()!;

            const adjacent_nodes = graph[closest.value] || {};
            const keys = Object.keys(adjacent_nodes);

            if (!keys.length) continue;

            for (let i = 0; keys.length > i; i++) {
                const v = keys[i]!;

                if (!hasOwn(adjacent_nodes, v)) continue;

                const cost_of_e = adjacent_nodes[v]!;
                const cost_of_s_to_u_plus_cost_of_e = closest.cost + cost_of_e;

                if (typeof costs[v] !== "undefined" && costs[v] <= cost_of_s_to_u_plus_cost_of_e) continue;

                costs[v] = cost_of_s_to_u_plus_cost_of_e;
                open.push(v, costs[v]);
                predecessor[v] = closest.value;
            }
        }

        if (typeof destination !== "undefined" && typeof costs[destination] === "undefined") {
            const msg = `Could not find a path from ${start} to ${destination}.`;
            throw new Error(msg);
        }

        return predecessor;
    }

    findPath(graph: Record<string, Record<string, number>>, start: string, destination: string): Array<string> {
        const predecessors = this.singleSourceShortestPaths(graph, start, destination);
        const nodes: Array<string> = [];
        let u = destination;

        while (u) {
            nodes.push(u);
            u = predecessors[u]!;
        }

        nodes.reverse();
        return nodes;
    }
}

export const dijkstra = new Dijkstra();
