/**
 * Process items in parallel with a max concurrency limit.
 */
export async function parallelLimit<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];
    
    for (const item of items) {
        const p = fn(item).then((result) => {
            results.push(result);
        });
        executing.push(p);
        
        if (executing.length >= limit) {
            await Promise.race(executing);
            // Remove finished promises from executing array
            // This is a simple way, though not the most efficient for huge lists
            // but for 3-5 limit it's perfectly fine.
            const index = executing.indexOf(p);
            if (index > -1) executing.splice(index, 1);
        }
    }
    
    await Promise.all(executing);
    return results;
}
