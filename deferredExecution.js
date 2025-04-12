import { readFile } from 'fs'

console.log('Start')

// Microtask
process.nextTick(() => {
  console.log('🟢 process.nextTick')
})

// Timer (macrotask)
setTimeout(() => {
  console.log('🟡 setTimeout 0ms')
}, 0)

// Immediate (macrotask, mas em outra fase)
setImmediate(() => {
  console.log('🔵 setImmediate')
})

// Simulando I/O
readFile('data.txt', 'utf8', () => {
  console.log('📄 readFile callback')

  process.nextTick(() => {
    console.log('🟢 nextTick inside readFile')
  })

  setTimeout(() => {
    console.log('🟡 setTimeout inside readFile')
  }, 0)

  setImmediate(() => {
    console.log('🔵 setImmediate inside readFile')
  })
})

console.log('End')
