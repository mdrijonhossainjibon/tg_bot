// src/app.ts
import { Worker } from 'worker_threads';

// Function to run the worker thread
function runService(n: number): Promise<number> {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./worker.js');

        // Listen for messages from the worker
        worker.on('message', resolve);
        // Listen for errors
        worker.on('error', reject);
        // Listen for exit events
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });

        // Send the data to the worker
        worker.postMessage(n);
    });
}

// Main function to execute the service
async function main() {
    try {
        const number = 10; // Example input
        console.log(`Calculating the factorial of ${number}...`);
        const result = await runService(number);
        console.log(`Factorial of ${number} is ${result}`);
    } catch (error) {
        console.error(error);
    }
}

// Execute the main function
main();
