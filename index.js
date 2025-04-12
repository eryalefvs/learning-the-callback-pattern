function addCps(a, b, callback) {      // The addCps() function is a synchronous CPS function. It's synchronous because it will
    callback (a + b)                   // complete its execution only when the callback complete its execution too.
}

// console.log("before")
// addCps(1, 2, result => console.log(`Result: ${result}`))
// console.log("after")

function additionAsync (a, b, callback) {
    setTimeout(() => callback(a + b), 100)
}

console.log("before")
additionAsync(1, 2, result => console.log(`Result: ${result}`))
console.log("after")