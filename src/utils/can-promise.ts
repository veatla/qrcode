export default function canPromise(): boolean {
        return typeof Promise === "function" && Promise.prototype && Promise.prototype.then;
}
