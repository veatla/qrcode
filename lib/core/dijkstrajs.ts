/******************************************************************************
 * Created 2008-08-19.
 * Modified 2026-02-23.
 * Modified by Altayev Nurzhan.
 *
 * Dijkstra path-finding functions. Adapted from the Dijkstar Python project.
 * Adapted and heavily modified from code by Wyatt Baldwin (MIT License).
 * Original copyright:
 *   Wyatt Baldwin <self@wyattbaldwin.com>
 *   All rights reserved
 *
 * Licensed under the MIT license.
 *
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *****************************************************************************/

/** Graph: node ID -> { neighbor ID -> edge cost } */
export type Graph = Record<string, Record<string, number>>;

/** Predecessor map: node ID => predecessor node ID */
export type Predecessors = Record<string, string>;

interface PriorityQueueItem {
  value: string;
  cost: number;
}

interface PriorityQueueInstance {
  queue: PriorityQueueItem[];
  sorter: (a: PriorityQueueItem, b: PriorityQueueItem) => number;
  push(value: string, cost: number): void;
  pop(): PriorityQueueItem | undefined;
  empty(): boolean;
}

function defaultSorter(a: PriorityQueueItem, b: PriorityQueueItem): number {
  return a.cost - b.cost;
}

function makePriorityQueue(opts?: {
  sorter?: (a: PriorityQueueItem, b: PriorityQueueItem) => number;
}): PriorityQueueInstance {
  const sorter = opts?.sorter ?? defaultSorter;
  const queue: PriorityQueueItem[] = [];

  return {
    queue,
    sorter,

    push(value: string, cost: number): void {
      queue.push({ value, cost });
      queue.sort(sorter);
    },

    pop(): PriorityQueueItem | undefined {
      return queue.shift();
    },

    empty(): boolean {
      return queue.length === 0;
    },
  };
}

/**
 * Find shortest paths from source node s to all reachable nodes.
 * If d is provided and unreachable, throws.
 */
export function singleSourceShortestPaths(
  graph: Graph,
  s: string,
  d?: string,
): Predecessors {
  const predecessors: Predecessors = {};
  const costs: Record<string, number> = {};
  costs[s] = 0;

  const open = makePriorityQueue();
  open.push(s, 0);

  while (!open.empty()) {
    const closest = open.pop();
    if (!closest) break;

    const u = closest.value;
    const costOfSToU = closest.cost;
    const adjacentNodes = graph[u] ?? {};

    for (const v of Object.keys(adjacentNodes)) {
      const costOfE = adjacentNodes[v];
      const costOfSToUPlusCostOfE = costOfSToU + costOfE;
      const costOfSToV = costs[v];
      const firstVisit = costs[v] === undefined;

      if (firstVisit || costOfSToV! > costOfSToUPlusCostOfE) {
        costs[v] = costOfSToUPlusCostOfE;
        open.push(v, costOfSToUPlusCostOfE);
        predecessors[v] = u;
      }
    }
  }

  if (d !== undefined && costs[d] === undefined) {
    throw new Error(`Could not find a path from ${s} to ${d}.`);
  }

  return predecessors;
}

/**
 * Build the shortest path from destination d back to source using the predecessor list.
 */
export function extractShortestPathFromPredecessorList(
  predecessors: Predecessors,
  d: string,
): string[] {
  const nodes: string[] = [];
  let u: string | undefined = d;
  while (u) {
    nodes.push(u);
    u = predecessors[u];
  }
  nodes.reverse();
  return nodes;
}

/**
 * Find the shortest path from node s to node d in the graph.
 */
export function findPath(graph: Graph, s: string, d: string): string[] {
  const predecessors = singleSourceShortestPaths(graph, s, d);
  return extractShortestPathFromPredecessorList(predecessors, d);
}

/** Legacy namespace-style export for compatibility */
export const dijkstra = {
  single_source_shortest_paths: singleSourceShortestPaths,
  extract_shortest_path_from_predecessor_list:
    extractShortestPathFromPredecessorList,
  find_path: findPath,
  PriorityQueue: {
    make: makePriorityQueue,
    default_sorter: defaultSorter,
    push: function (this: PriorityQueueInstance, value: string, cost: number) {
      this.queue.push({ value, cost });
      this.queue.sort(this.sorter);
    },
    pop: function (this: PriorityQueueInstance) {
      return this.queue.shift();
    },
    empty: function (this: PriorityQueueInstance) {
      return this.queue.length === 0;
    },
  },
};
