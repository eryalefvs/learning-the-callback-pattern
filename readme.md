# 📚 Callback Pattern no Node.js

Este documento explica o **Callback Pattern** no Node.js e aprofunda no comportamento de funções como `process.nextTick()`, `setImmediate()` e `setTimeout()`. Também discute diferenças entre execução síncrona e assíncrona, microtasks vs. macrotasks e os riscos de I/O starvation.

---

## 📌 O que é Callback?

Callback é uma função passada como argumento para outra função. Ela é **chamada quando uma operação termina**, principalmente operações assíncronas, como leitura de arquivos, requisições HTTP, etc.

Exemplo básico:

```js
function soma(a, b, cb) {
  const resultado = a + b
  cb(resultado)
}

soma(2, 3, (res) => {
  console.log(res) // 5
})
```
---

## Síncrono e Assíncrono
Precisamos entender esses dois conceitos: o processamento síncrono é aquele que acontece em sequência e ordenado, seguindo uma fila, e o outro processamento assíncrono só começa após o atual ser concluído. Isso acontece nos navegadores que fazem o carregamento dos arquivos e recursos de forma ordenada, onde um carregamento só começa após o outro ter sido concluído.

Já o processamento assíncrono é quando os processos são executados ao mesmo tempo, sem nada que impeça de outro começar enquanto o que foi iniciado anteriormente termine. Assim um processo pode iniciar mesmo que outro esteja em execução. Isso acontece muito no enviado de mensagens ou emails, podemos enviar uma mensagem, porém a mesma ai nem tenha chegado ao destino e mesmo assim podemos já criar e mandar outra mensagem. **O Node.JS usa o processamento assíncrono**

Exemplo prático com leitura de arquivos:
```js
import { readFile } from 'fs'

const cache = new Map()

function inconsistentRead(filename, cb) {
  if (cache.has(filename)) {
    // Invocação síncrona
    cb(cache.get(filename))
  } else {
    // Invocação assíncrona
    readFile(filename, 'utf8', (err, data) => {
      cache.set(filename, data)
      cb(data)
    })
  }
}

function createFileReader(filename) {
  const listeners = []

  inconsistentRead(filename, value => {
    listeners.forEach(listener => listener(value))
  })

  return {
    onDataReady: listener => listeners.push(listener)
  }
}

const reader1 = createFileReader('data.txt')
reader1.onDataReady(data => {
  console.log(`First call data: ${data}`)

  const reader2 = createFileReader('data.txt')
  reader2.onDataReady(data => {
    console.log(`Second call data: ${data}`)
  })
})

```
A função ```InconsistentRead```  tenta ler um arquivo de forma inconsistente:

- Se o conteúdo já estiver em ```cache```, ela chama o callback síncronamente (imediato).

- Se não estiver, ela chama ```readFile```, que é assíncrono, e só depois chama o callback.

Na função ```createFileReader``` é criado um "reader" para um arquivo. Ele faz o seguinte:

- Chama ```inconsistentRead``` com um callback que vai disparar todos os ```listeners```.

- ```listeners``` são funções que você pode adicionar com ```onDataReady```.

Problema: Se ```inconsistentRead``` for síncrona, o callback com ```listeners.forEach(...)``` roda antes de alguém adicionar listeners com ```onDataReady```. Resultado: os listeners nunca são chamados.

Na parte final:
- ```reader1``` é criado e tenta ler ```'data.txt'```.
    - Como provavelmente **não está no cache ainda**, vai fazer a leitura de forma assíncrona.

    - O listener será adicionado antes da leitura acabar → funciona.

- Dentro do callback do ```reader1```, é criado ```reader2```.

    - Agora 'data.txt' já está no cache, então inconsistentRead será síncrona.

    - Mas os listeners só são adicionados depois da execução síncrona.

    - Resultado: ```listener``` nunca é chamado.

Quando o arquivo está em cache, `cb()` é executado síncronamente, ou seja, antes do `onDataReady` ser registrado. O `forEach` tenta executar os listeners antes deles existirem, por isso o segundo listener não é chamado.

---

## 🔄 Event Loop: Microtasks vs Macrotasks
Node.js utiliza um event loop para controlar a ordem de execução de tarefas. Dentro disso, temos:

### ✅ Microtasks
Executadas antes de qualquer I/O, logo após a operação atual.

- ```process.nextTick()```

- Promises (`.then`, `async/await`)

### ✅ Macrotasks
Executadas em fases específicas do event loop.

- `setTimeout()`

- `setImmediate()`

- Callbacks de I/O (`readFile`, etc)

---

## ⚙️ Comparando process.nextTick(), setImmediate() e setTimeout()

### 🔸 process.nextTick()
- Executa imediatamente após a função atual terminar, antes de qualquer outro evento assíncrono.

- Útil para pequenos ajustes assíncronos rápidos.

- Cuidado: pode causar I/O starvation (fome de I/O) se usado de forma recursiva.

### 🔸 setImmediate()
- Executa na próxima fase do event loop, após os eventos de I/O.

- Seguro e previsível.

- Ideal para executar código depois que todos os I/O forem processados.

### 🔸 setTimeout(callback, 0)
- Executa no próximo ciclo completo do event loop.

- Pode ser mais lento que setImmediate dependendo do contexto.

---

🧪 Exemplo comparativo:
``` js
import { readFile } from 'fs'

console.log('Start')

process.nextTick(() => {
  console.log('🟢 process.nextTick')
})

setTimeout(() => {
  console.log('🟡 setTimeout 0ms')
}, 0)

setImmediate(() => {
  console.log('🔵 setImmediate')
})

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

```

💡 Saída esperada:
```
Start
End
🟢 process.nextTick
🟡 setTimeout 0ms
🔵 setImmediate
📄 readFile callback
🟢 nextTick inside readFile
🔵 setImmediate inside readFile
🟡 setTimeout inside readFile
```

---

## 📘 Referência

CASCIARO, Mario. MAMMINO, Luciano. Node.js Design Patterns. 3ª ed. Birmingham: Packt Publishing Ltd, 2020.