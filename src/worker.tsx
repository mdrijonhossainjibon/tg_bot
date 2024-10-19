// src/worker.ts
import { parentPort } from 'worker_threads';

// This function simulates a CPU-intensive task
function computeFactorial(n: number): number {
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Listen for messages from the main thread
parentPort?.on('message', (n: number) => {
    const result = computeFactorial(n);
    // Send the result back to the main thread
    parentPort?.postMessage(result);
});
