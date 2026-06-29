const state = {
  allItems: [],
  items: [],
  index: 0,
  mode: 'hand',
  revealed: false,
  schedule: null,
  activeDay: null,
  isLoading: true,
  loadedImages: new Set(),
  loadToken: 0,
  pendingIndex: 0,
  theme: localStorage.getItem('quiz-theme') || 'dark',
}

const els = {
  answerLabel: document.querySelector('.answer-label'),
  answerNote: document.querySelector('#answer-note'),
  answerPanel: document.querySelector('#answer-panel'),
  answerSummary: document.querySelector('#answer-summary'),
  answerText: document.querySelector('#answer-text'),
  choices: document.querySelector('#choices'),
  handImage: document.querySelector('#hand-image'),
  loadingLabel: document.querySelector('#loading-label'),
  modeHand: document.querySelector('#mode-hand'),
  modeTrivia: document.querySelector('#mode-trivia'),
  nextButton: document.querySelector('#next-button'),
  prevButton: document.querySelector('#prev-button'),
  progressGrid: document.querySelector('#progress-grid'),
  questionCount: document.querySelector('#question-count'),
  questionText: document.querySelector('#question-text'),
  quizStage: document.querySelector('.quiz-stage'),
  revealButton: document.querySelector('#reveal-button'),
  themeToggle: document.querySelector('#theme-toggle'),
}

const MIN_LOADING_MS = 140

function getBeijingDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

function getRequestedDay(schedule) {
  const params = new URLSearchParams(window.location.search)
  const requestedDate = params.get('date')
  if (requestedDate) {
    return schedule.days.find((day) => day.date === requestedDate)
  }

  const requestedDay = params.get('day')
  if (requestedDay) {
    return schedule.days[Number(requestedDay) - 1]
  }

  const today = getBeijingDateKey()
  return schedule.days.find((day) => day.date === today) || schedule.days[0]
}

function currentItem() {
  return state.items[state.index]
}

function currentBlock() {
  const item = currentItem()
  return state.mode === 'hand' ? item.hand : item.trivia
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function loadImage(src) {
  if (state.loadedImages.has(src)) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      state.loadedImages.add(src)
      resolve()
    }
    image.onerror = reject
    image.src = src
  })
}

function warmImage(index) {
  const item = state.items[index]
  if (!item) return
  loadImage(item.hand.imageUrl).catch(() => {})
}

function warmAdjacentImages() {
  warmImage(state.index - 1)
  warmImage(state.index + 1)
}

function setTheme(theme) {
  state.theme = theme
  document.documentElement.dataset.theme = theme
  localStorage.setItem('quiz-theme', theme)
}

function renderProgress() {
  els.progressGrid.innerHTML = ''
  state.items.forEach((item, index) => {
    const currentIndex = state.isLoading ? state.pendingIndex : state.index
    const button = document.createElement('button')
    button.className = 'progress-cell'
    button.type = 'button'
    button.textContent = index + 1
    button.setAttribute('aria-label', `第 ${index + 1} 题`)
    button.disabled = state.isLoading
    if (index === currentIndex) button.classList.add('is-current')
    if (index < state.index) button.classList.add('is-seen')
    button.addEventListener('click', () => {
      showQuestion(index)
    })
    els.progressGrid.append(button)
  })
}

function renderLoading(index) {
  state.isLoading = true
  state.pendingIndex = index
  els.quizStage.classList.add('is-loading')
  els.quizStage.setAttribute('aria-busy', 'true')
  els.loadingLabel.textContent = `载入第 ${index + 1} 题...`
  els.questionCount.textContent = `${index + 1} / ${state.items.length}`
  els.handImage.removeAttribute('src')
  els.handImage.alt = ''
  els.questionText.textContent = ''
  els.choices.hidden = true
  els.choices.innerHTML = ''
  els.answerPanel.hidden = true
  els.revealButton.textContent = '显示答案'
  els.prevButton.disabled = true
  els.nextButton.disabled = true
  els.revealButton.disabled = true
  els.modeHand.disabled = true
  els.modeTrivia.disabled = true
  renderProgress()
}

function renderChoices(block) {
  if (!block.choices) {
    els.choices.hidden = true
    els.choices.innerHTML = ''
    return
  }

  els.choices.hidden = false
  els.choices.innerHTML = ''

  block.choices.forEach((choice) => {
    const node = document.createElement('div')
    node.className = 'choice-tile'
    node.textContent = choice
    if (state.revealed && choice === block.answer) {
      node.classList.add('is-answer')
    }
    els.choices.append(node)
  })
}

function renderAnswer(block) {
  els.answerPanel.hidden = !state.revealed
  els.revealButton.textContent = state.revealed ? '隐藏答案' : '显示答案'

  if (!state.revealed) return

  els.answerLabel.textContent = state.mode === 'hand' ? '何切答案' : '豆知识答案'
  els.answerText.textContent = block.answer
  els.answerSummary.textContent = block.summary
  els.answerNote.hidden = !block.note
  els.answerNote.textContent = block.note || ''
}

function setMode(mode) {
  if (state.isLoading) return
  state.mode = mode
  state.revealed = false
  render()
}

function go(delta) {
  if (state.isLoading) return
  const nextIndex = state.index + delta
  showQuestion(nextIndex)
}

async function showQuestion(index) {
  if (index < 0 || index >= state.items.length) return

  const item = state.items[index]
  const token = state.loadToken + 1
  state.loadToken = token
  renderLoading(index)

  await Promise.all([loadImage(item.hand.imageUrl).catch(() => {}), wait(MIN_LOADING_MS)])
  if (token !== state.loadToken) return

  state.index = index
  state.pendingIndex = index
  state.revealed = false
  render()
  warmAdjacentImages()
}

function render() {
  const item = currentItem()
  const block = currentBlock()

  state.isLoading = false
  els.quizStage.classList.remove('is-loading')
  els.quizStage.setAttribute('aria-busy', 'false')
  els.questionCount.textContent = `${state.index + 1} / ${state.items.length}`
  els.handImage.src = item.hand.imageUrl
  els.handImage.alt = `第 ${state.index + 1} 题手牌`
  els.questionText.textContent = block.prompt
  els.prevButton.disabled = state.index === 0
  els.nextButton.disabled = state.index === state.items.length - 1
  els.revealButton.disabled = false
  els.modeHand.disabled = false
  els.modeTrivia.disabled = false
  els.modeHand.classList.toggle('is-active', state.mode === 'hand')
  els.modeTrivia.classList.toggle('is-active', state.mode === 'trivia')
  els.modeHand.setAttribute('aria-selected', state.mode === 'hand')
  els.modeTrivia.setAttribute('aria-selected', state.mode === 'trivia')

  renderChoices(block)
  renderAnswer(block)
  renderProgress()
}

async function init() {
  setTheme(state.theme)
  const [quizResponse, scheduleResponse] = await Promise.all([
    fetch('./data/quiz.json'),
    fetch('./data/schedule.json'),
  ])
  const data = await quizResponse.json()
  state.schedule = await scheduleResponse.json()
  state.allItems = data.items
  state.activeDay = getRequestedDay(state.schedule) || state.schedule.days[0]
  const itemById = new Map(state.allItems.map((item) => [item.id, item]))
  state.items = state.activeDay.questionIds.map((id) => itemById.get(id)).filter(Boolean)
  if (state.items.length === 0) state.items = state.allItems.slice(0, state.schedule.dailySize || 4)

  els.prevButton.addEventListener('click', () => go(-1))
  els.nextButton.addEventListener('click', () => go(1))
  els.revealButton.addEventListener('click', () => {
    state.revealed = !state.revealed
    render()
  })
  els.modeHand.addEventListener('click', () => setMode('hand'))
  els.modeTrivia.addEventListener('click', () => setMode('trivia'))
  els.themeToggle.addEventListener('click', () => {
    setTheme(state.theme === 'dark' ? 'light' : 'dark')
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') go(-1)
    if (event.key === 'ArrowRight') go(1)
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (state.isLoading) return
      state.revealed = !state.revealed
      render()
    }
  })

  await showQuestion(0)
}

init().catch((error) => {
  state.isLoading = false
  els.quizStage.classList.remove('is-loading')
  els.quizStage.setAttribute('aria-busy', 'false')
  els.questionText.textContent = '数据加载失败'
  console.error(error)
})
