const app = document.querySelector("#app")

const photo =
  "https://images.unsplash.com/photo-1588075592639-14e36e061352?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080"

const categoryLabels = {
  principal: "Prato principal",
  acompanhamento: "Acompanhamento",
  sobremesa: "Sobremesa",
  sopa: "Sopa",
}

const state = {
  authenticated: Boolean(getToken()),
  apiError: "",
  authMode: "login",
  profile: null,
  screen: "home",
  selectedDish: null,
  selectedDay: 0,
  todayIndex: 0,
  adminTab: "overview",
  menuEditorOpen: false,
  editingDish: null,
  catalog: [],
  menu: [],
}

function getToken() {
  return localStorage.getItem("nutriescola-token") ||
    sessionStorage.getItem("nutriescola-token")
}

function storeToken(token, remember) {
  const storage = remember ? localStorage : sessionStorage
  const otherStorage = remember ? sessionStorage : localStorage
  otherStorage.removeItem("nutriescola-token")
  storage.setItem("nutriescola-token", token)
}

function clearToken() {
  localStorage.removeItem("nutriescola-token")
  sessionStorage.removeItem("nutriescola-token")
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body) headers.set("Content-Type", "application/json")
  const token = getToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  let response
  try {
    response = await fetch(`/api${path}`, { ...options, headers })
  } catch {
    throw new Error("Não foi possível conectar à API. Verifique se o backend está em execução.")
  }

  const result = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(result?.error?.message || "A API não conseguiu concluir a solicitação.")
  }
  return result?.data
}

function localDateISO(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function currentWeekStart() {
  const monday = new Date()
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return localDateISO(monday)
}

async function loadApplicationData() {
  const [catalog, menu] = await Promise.all([
    api("/dishes"),
    api(`/menu?weekStart=${currentWeekStart()}`),
  ])
  state.catalog = catalog
  state.menu = menu.days
  const today = state.menu.findIndex((day) => day.date === localDateISO())
  state.todayIndex = today >= 0 ? today : 0
  state.selectedDay = state.todayIndex
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function getDish(id) {
  return state.catalog.find((dish) => dish.id === id)
}

function getDayDishes(dayIndex) {
  return (state.menu[dayIndex]?.ids || []).map(getDish).filter(Boolean)
}

function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0)
}

function topbar(title, subtitle) {
  return `
    <header class="topbar">
      <div class="topbar__copy">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
      </div>
      <button class="button button--ghost button--compact" data-action="notice">Exportar PDF</button>
    </header>`
}

function render() {
  app.innerHTML = state.authenticated ? renderApplication() : renderAuth()
}

function renderAuth() {
  const registering = state.authMode === "register"
  return `
    <main class="auth">
      <section class="auth__visual">
        <img src="${photo}" alt="Estudante diante de uma refeição escolar saudável">
        <div class="auth__overlay"></div>
        <div class="auth__visual-content">
          ${brand(true)}
          <div>
            <p class="eyebrow eyebrow--light">Alimentação escolar transparente</p>
            <h1>Informação nutricional para toda a comunidade escolar.</h1>
            <p>Consulte cardápios, alergênicos e indicadores nutricionais em um único ambiente institucional.</p>
            <small>Foto: CDC via Unsplash</small>
          </div>
        </div>
      </section>
      <section class="auth__form-area">
        <div class="auth__mobile-brand">${brand(false)}</div>
        <div class="auth-card">
          <p class="eyebrow">${
            registering ? "Cadastro de usuário" : "Área de acesso"
          }</p>
          <h2>${registering ? "Crie seu acesso" : "Bem-vindo de volta"}</h2>
          <p class="muted">${
            registering
              ? "Preencha seus dados e escolha seu perfil na comunidade escolar."
              : "Entre com suas credenciais para acessar o cardápio escolar."
          }</p>
          <form id="auth-form" class="form">
            ${
              registering
                ? `
              <label>Nome completo
                <input name="name" autocomplete="name" required minlength="3" placeholder="Nome e sobrenome">
              </label>
              <label>Perfil de cadastro
                <select name="role" required>
                  <option value="aluno">Aluno</option>
                  <option value="professor">Professor</option>
                  <option value="colaborador">Colaborador</option>
                </select>
              </label>`
                : ""
            }
            <label>E-mail
              <input name="email" type="email" autocomplete="email" required placeholder="nome@escola.gov.br">
            </label>
            <label>Senha
              <span class="password-field">
                <input name="password" type="password" minlength="8" autocomplete="${
                  registering ? "new-password" : "current-password"
                }" required placeholder="Mínimo de 8 caracteres">
                <button type="button" data-action="toggle-password">Mostrar</button>
              </span>
            </label>
            ${
              registering
                ? `<label>Confirmar senha
                    <input name="confirmPassword" type="password" minlength="8" autocomplete="new-password" required placeholder="Digite a senha novamente">
                  </label>`
                : ""
            }
            <label class="checkbox"><input name="remember" type="checkbox" checked> Manter acesso neste dispositivo</label>
            <p class="form-error" id="auth-error" role="alert">${escapeHtml(state.apiError)}</p>
            <button class="button button--primary button--full" type="submit">${
              registering ? "Criar cadastro" : "Entrar no sistema"
            }</button>
          </form>
          <div class="auth-card__footer">
            <p>${registering ? "Já é cadastrado?" : "Ainda não possui acesso?"}
              <button data-action="toggle-auth">${
                registering ? "Voltar para o login" : "Cadastre-se"
              }</button>
            </p>
            <small>${
              registering
                ? "Seu perfil será salvo no sistema e a senha será armazenada com hash de segurança."
                : "Use qualquer e-mail válido e uma senha com pelo menos 8 caracteres."
            }</small>
          </div>
        </div>
        <p class="institution">Ceti Senador José Cândido Ferraz · São João do Piauí</p>
      </section>
    </main>`
}

function brand(inverse) {
  return `<div class="brand ${inverse ? "brand--inverse" : ""}">
    <span class="brand__mark">NE</span>
    <span><strong>NutriEscola</strong><small>Cardápio Digital</small></span>
  </div>`
}

function renderApplication() {
  return `
    <div class="app-shell">
      ${sidebar()}
      <main class="content">${renderScreen()}</main>
      ${mobileNav()}
      ${state.menuEditorOpen ? menuEditor() : ""}
    </div>`
}

function sidebar() {
  const user = state.profile || { name: "Maria Silva", role: "nutricionista" }
  return `<aside class="sidebar">
    ${brand(true)}
    <div class="school"><small>Instituição</small><strong>Ceti Senador José Cândido Ferraz</strong><span>São João do Piauí — PI</span></div>
    <nav>${navButtons(true)}</nav>
    <div class="sidebar__user">
      <span class="avatar">${escapeHtml(user.name.charAt(0).toUpperCase())}</span>
      <span><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.role)}</small></span>
      <button data-action="logout">Sair</button>
    </div>
  </aside>`
}

function navButtons(withLabels) {
  const items = [
    ["home", "Hoje", "Cardápio de Hoje"],
    ["weekly", "Semana", "Semana Completa"],
  ]
  if (state.profile?.role === "administrador") {
    items.push(["admin", "Gestão", "Gestão"])
  }
  return items
    .map(([id, short, full]) => {
      const active =
        state.screen === id || (state.screen === "dish" && id === "home")
      return `<button class="${
        active ? "active" : ""
      }" data-action="navigate" data-screen="${id}">
        <span class="nav-icon">${
          id === "home" ? "●" : id === "weekly" ? "▦" : "◆"
        }</span>
        ${withLabels ? full : short}
      </button>`
    })
    .join("")
}

function mobileNav() {
  return `<nav class="mobile-nav">${navButtons(false)}<button data-action="logout"><span class="nav-icon">↪</span>Sair</button></nav>`
}

function renderScreen() {
  if (state.screen === "weekly") return weeklyScreen()
  if (state.screen === "dish") return detailScreen()
  if (state.screen === "admin") return adminScreen()
  return homeScreen()
}

function homeScreen() {
  const day = state.menu[state.todayIndex]
  const items = getDayDishes(state.todayIndex)
  const allergens = [...new Set(items.flatMap((dish) => dish.allergens))]
  return `<section class="screen">
    ${topbar("Cardápio de Hoje", `${day.day}, ${day.dateLabel}`)}
    <div class="page">
      <div class="stats">
        ${statCard("Calorias totais", sum(items, "calories"), "kcal", "blue")}
        ${statCard("Proteínas", sum(items, "protein"), "g", "green")}
        ${statCard("Fibras", sum(items, "fiber"), "g", "cyan")}
        ${statCard("Alergênicos", allergens.length || "Nenhum", "", allergens.length ? "amber" : "green")}
      </div>
      <div class="home-grid">
        <div>
          <div class="section-heading"><h2>Pratos do dia</h2><span>${items.length} itens</span></div>
          <div class="dish-list">${items.map(dishRow).join("") || emptyState()}</div>
        </div>
        <aside class="side-stack">
          <div class="card"><h3>Distribuição de macros</h3>${macroSummary(items)}</div>
          <div class="card"><h3>Alergênicos presentes</h3>${
            allergens.length
              ? allergens
                  .map(
                    (item) =>
                      `<span class="tag tag--warning">${escapeHtml(item)}</span>`,
                  )
                  .join("")
              : `<p class="success">Nenhum identificado</p>`
          }</div>
          <div class="card"><h3>Próximos dias</h3>${state.menu
            .slice(state.todayIndex + 1, state.todayIndex + 4)
            .map(
              (day) =>
                `<div class="next-day"><span><strong>${day.day}</strong><small>${escapeHtml(getDish(day.ids[0])?.name || "Sem prato")}</small></span><small>${day.dateLabel}</small></div>`,
            )
            .join("")}</div>
        </aside>
      </div>
    </div>
  </section>`
}

function statCard(label, value, unit, tone) {
  return `<div class="stat-card stat-card--${tone}"><small>${label}</small><strong>${value}<span>${unit}</span></strong></div>`
}

function dishRow(dish) {
  return `<button class="dish-row" data-action="open-dish" data-id="${dish.id}">
    <img src="${escapeHtml(dish.image)}" alt="${escapeHtml(dish.name)}">
    <span class="dish-row__copy"><small class="category category--${dish.category}">${categoryLabels[dish.category]}</small><strong>${escapeHtml(dish.name)}</strong><span>${escapeHtml(dish.description)}</span></span>
    <span class="nutrients"><span><strong>${dish.calories}</strong><small>kcal</small></span><span><strong>${dish.protein}g</strong><small>prot.</small></span><span><strong>${dish.carbs}g</strong><small>carbs</small></span></span>
  </button>`
}

function macroSummary(items) {
  const values = [
    ["Proteínas", sum(items, "protein"), "blue"],
    ["Carboidratos", sum(items, "carbs"), "cyan"],
    ["Gorduras", sum(items, "fat"), "purple"],
  ]
  const total = values.reduce((acc, item) => acc + item[1], 0) || 1
  return `<div class="macro-list">${values.map(([label, value, tone]) => `<div><span><i class="dot dot--${tone}"></i>${label}</span><strong>${value}g <small>${Math.round((value / total) * 100)}%</small></strong></div>`).join("")}</div>`
}

function weeklyScreen() {
  const day = state.menu[state.selectedDay]
  const items = getDayDishes(state.selectedDay)
  const firstDay = state.menu[0]
  const lastDay = state.menu[state.menu.length - 1]
  return `<section class="screen">
    ${topbar("Cardápio Semanal", `${firstDay.dateLabel} a ${lastDay.dateLabel}`)}
    <div class="weekly">
      <nav class="day-picker">${state.menu.map((item, index) => `<button class="${index === state.selectedDay ? "active" : ""}" data-action="select-day" data-index="${index}"><strong>${item.day}</strong><small>${item.dateLabel}</small></button>`).join("")}</nav>
      <div class="weekly__content">
        <div class="section-heading"><h2>${day.day} — ${day.dateLabel}</h2><span>${sum(items, "calories")} kcal · ${sum(items, "protein")}g proteínas</span></div>
        <div class="dish-grid">${items.map(dishCard).join("") || emptyState()}</div>
      </div>
    </div>
  </section>`
}

function dishCard(dish) {
  return `<button class="dish-card" data-action="open-dish" data-id="${dish.id}">
    <img src="${escapeHtml(dish.image)}" alt="${escapeHtml(dish.name)}">
    <div><small class="category category--${dish.category}">${categoryLabels[dish.category]}</small><h3>${escapeHtml(dish.name)}</h3><p>${escapeHtml(dish.description)}</p><span>${dish.calories} kcal · ${dish.protein}g proteína</span></div>
  </button>`
}

function detailScreen() {
  const dish = getDish(state.selectedDish)
  if (!dish) {
    state.screen = "home"
    return homeScreen()
  }
  return `<section class="screen">
    <header class="topbar"><button class="back" data-action="navigate" data-screen="home">← Voltar</button><span class="category category--${dish.category}">${categoryLabels[dish.category]}</span></header>
    <div class="detail">
      <div class="detail__left">
        <img class="detail__image" src="${escapeHtml(dish.image)}" alt="${escapeHtml(dish.name)}">
        <h1>${escapeHtml(dish.name)}</h1><p>${escapeHtml(dish.description)}</p>
        <div>${dish.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      <div class="detail__right">
        <div class="calorie-card"><span><small>Calorias totais</small><strong>${dish.calories}</strong><small>kcal por porção</small></span></div>
        <div class="card"><h3>Informações nutricionais</h3>${nutrientBars(dish)}</div>
        <div class="recommendation"><strong>Recomendação nutricional</strong><p>Este prato atende a aproximadamente ${Math.round((dish.calories / 2000) * 100)}% das necessidades calóricas diárias.</p></div>
      </div>
    </div>
  </section>`
}

function nutrientBars(dish) {
  const entries = [
    ["Proteínas", dish.protein],
    ["Carboidratos", dish.carbs],
    ["Gorduras", dish.fat],
    ["Fibras", dish.fiber],
  ]
  const max = Math.max(...entries.map((item) => item[1]), 1)
  return `<div class="bars">${entries.map(([label, value]) => `<div><span>${label}<strong>${value}g</strong></span><i><b style="width:${(value / max) * 100}%"></b></i></div>`).join("")}</div>`
}

function adminScreen() {
  const firstDay = state.menu[0]
  const lastDay = state.menu[state.menu.length - 1]
  return `<section class="screen">
    ${topbar("Gestão do Cardápio", `Ceti Senador José Cândido Ferraz · ${firstDay.dateLabel} a ${lastDay.dateLabel}`)}
    <nav class="tabs">${[
      ["overview", "Visão Geral"],
      ["meals", "Refeições"],
      ["reports", "Relatórios"],
    ]
      .map(
        ([id, label]) =>
          `<button class="${
            state.adminTab === id ? "active" : ""
          }" data-action="admin-tab" data-tab="${id}">${label}</button>`,
      )
      .join("")}</nav>
    <div class="page">${adminContent()}</div>
  </section>`
}

function adminContent() {
  if (state.adminTab === "meals") {
    return `<div class="table-card"><table><thead><tr><th>Prato</th><th>Calorias</th><th>Alergênico</th><th>Categoria</th></tr></thead><tbody>${state.catalog.map((dish) => `<tr><td>${escapeHtml(dish.name)}</td><td>${dish.calories} kcal</td><td>${dish.allergens.length ? escapeHtml(dish.allergens.join(", ")) : "Não"}</td><td>${categoryLabels[dish.category]}</td></tr>`).join("")}</tbody></table></div>`
  }
  if (state.adminTab === "reports") {
    return `<div class="report-grid">${["Relatório Mensal — Agosto 2025", "Análise Nutricional — Semana 36", "Pesquisa de Satisfação — Setembro"].map((title) => `<article class="card report"><small>PDF</small><h3>${title}</h3><p>Resumo consolidado dos dados do cardápio escolar.</p><button class="link" data-action="notice">Baixar relatório</button></article>`).join("")}</div>`
  }
  return `<div class="admin-overview">
    <div class="stats">${statCard("Refeições hoje", 342, "", "blue")}${statCard("Satisfação", "94%", "", "amber")}${statCard("Desperdício", "3,2 kg", "", "cyan")}</div>
    <div class="admin-grid">
      <div class="card"><h3>Aprovação por turma</h3>${["1º Ano A", "2º Ano B", "3º Ano A", "4º Ano C", "5º Ano B"].map((name, index) => `<div class="approval"><span>${name}</span><i><b style="width:${95 - index * 3}%"></b></i><strong>${95 - index * 3}%</strong></div>`).join("")}</div>
      <div class="card quick-actions"><h3>Ações rápidas</h3><button data-action="open-menu-editor"><span>+</span> Editar cardápio semanal <b>→</b></button><button data-action="notice"><span>□</span> Enviar cardápio aos pais <b>→</b></button><button data-action="notice"><span>◇</span> Registrar estoque <b>→</b></button></div>
    </div>
  </div>`
}

function menuEditor() {
  const editing = state.editingDish
  const day = state.menu[state.selectedDay]
  return `<div class="drawer-backdrop" data-action="close-drawer">
    <section class="drawer" role="dialog" aria-modal="true" aria-label="Editar cardápio semanal">
      <header><span><small>Gestão semanal</small><h2>${
        editing === "new"
          ? "Novo prato"
          : editing
            ? "Editar prato"
            : "Editar cardápio semanal"
      }</h2></span><button data-action="close-menu-editor" aria-label="Fechar">×</button></header>
      ${
        editing
          ? dishForm(editing === "new" ? null : getDish(editing))
          : `
        <div class="drawer__days"><p>Dia do cardápio</p><div>${state.menu.map((item, index) => `<button class="${index === state.selectedDay ? "active" : ""}" data-action="editor-day" data-index="${index}">${item.day.slice(0, 3)}</button>`).join("")}</div><span><strong>${day.day}, ${day.dateLabel}</strong><small>${day.ids.length} pratos</small><button class="button button--primary button--compact" data-action="new-dish">+ Novo prato</button></span></div>
        <div class="drawer__list">${state.catalog.map(editorDishRow).join("")}</div>
        <footer><small>Alterações aplicadas automaticamente.</small><button class="button button--dark" data-action="close-menu-editor">Concluir</button></footer>`
      }
    </section>
  </div>`
}

function editorDishRow(dish) {
  const included = state.menu[state.selectedDay].ids.includes(dish.id)
  return `<article class="editor-dish"><img src="${escapeHtml(dish.image)}" alt=""><span><strong>${escapeHtml(dish.name)}</strong><small>${categoryLabels[dish.category]} · ${dish.calories} kcal</small></span><div><button class="button button--ghost button--compact" data-action="edit-dish" data-id="${dish.id}">Editar</button><button class="button ${
    included ? "button--danger" : "button--soft"
  } button--compact" data-action="toggle-menu-dish" data-id="${dish.id}">${
    included ? "Remover" : "Adicionar"
  }</button></div></article>`
}

function dishForm(dish) {
  const item = dish || {
    name: "",
    category: "principal",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    description: "",
    image: "",
    allergens: [],
    tags: [],
  }
  return `<form id="dish-form" class="drawer-form" data-id="${dish?.id || ""}">
    <label>Nome do prato<input name="name" required value="${escapeHtml(item.name)}"></label>
    <label>Categoria<select name="category">${Object.entries(categoryLabels)
      .map(
        ([value, label]) =>
          `<option value="${value}" ${
            item.category === value ? "selected" : ""
          }>${label}</option>`,
      )
      .join("")}</select></label>
    <div class="form-grid">${["calories", "protein", "carbs", "fat", "fiber"].map((field) => `<label>${({ calories: "Calorias", protein: "Proteínas", carbs: "Carboidratos", fat: "Gorduras", fiber: "Fibras" })[field]}<input name="${field}" type="number" min="0" step="0.1" required value="${item[field]}"></label>`).join("")}</div>
    <label>Descrição<textarea name="description" required rows="3">${escapeHtml(item.description)}</textarea></label>
    <label>URL da imagem<input name="image" type="url" value="${escapeHtml(item.image)}"></label>
    <label>Alergênicos, separados por vírgula<input name="allergens" value="${escapeHtml(item.allergens.join(", "))}"></label>
    <label>Marcadores, separados por vírgula<input name="tags" value="${escapeHtml(item.tags.join(", "))}"></label>
    <p class="form-error" id="dish-error" role="alert"></p>
    <div class="form-actions">${
      dish
        ? `<button class="button button--danger" type="button" data-action="delete-dish" data-id="${dish.id}">Excluir prato</button>`
        : "<span></span>"
    }<span><button class="button button--ghost" type="button" data-action="cancel-dish-edit">Cancelar</button><button class="button button--primary" type="submit">${
      dish ? "Salvar alterações" : "Adicionar prato"
    }</button></span></div>
  </form>`
}

function emptyState() {
  return `<div class="empty"><strong>Nenhum prato neste dia</strong><p>Use a gestão do cardápio para adicionar opções.</p></div>`
}

app.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]")
  if (!button) return
  const action = button.dataset.action

  if (action === "toggle-auth") {
    state.authMode = state.authMode === "login" ? "register" : "login"
    state.apiError = ""
  } else if (action === "toggle-password") {
    const input = button.parentElement.querySelector("input")
    input.type = input.type === "password" ? "text" : "password"
    button.textContent = input.type === "password" ? "Mostrar" : "Ocultar"
    return
  } else if (action === "logout") {
    clearToken()
    localStorage.removeItem("nutriescola-auth")
    sessionStorage.removeItem("nutriescola-auth")
    localStorage.removeItem("nutriescola-user")
    state.authenticated = false
    state.profile = null
    state.catalog = []
    state.menu = []
    state.screen = "home"
  } else if (action === "navigate") {
    state.screen = button.dataset.screen
    state.selectedDish = null
  } else if (action === "open-dish") {
    state.selectedDish = button.dataset.id
    state.screen = "dish"
  } else if (action === "select-day") {
    state.selectedDay = Number(button.dataset.index)
  } else if (action === "admin-tab") {
    state.adminTab = button.dataset.tab
  } else if (action === "open-menu-editor") {
    state.menuEditorOpen = true
  } else if (action === "close-menu-editor") {
    state.menuEditorOpen = false
    state.editingDish = null
  } else if (action === "close-drawer") {
    if (event.target === button) {
      state.menuEditorOpen = false
      state.editingDish = null
    } else return
  } else if (action === "editor-day") {
    state.selectedDay = Number(button.dataset.index)
  } else if (action === "new-dish") {
    state.editingDish = "new"
  } else if (action === "edit-dish") {
    state.editingDish = button.dataset.id
  } else if (action === "cancel-dish-edit") {
    state.editingDish = null
  } else if (action === "toggle-menu-dish") {
    const day = state.menu[state.selectedDay]
    const ids = day.ids.includes(button.dataset.id)
      ? day.ids.filter((id) => id !== button.dataset.id)
      : [...day.ids, button.dataset.id]
    try {
      await api(`/menu/${day.date}`, {
        method: "PUT",
        body: JSON.stringify({ dishIds: ids }),
      })
      day.ids = ids
    } catch (error) {
      window.alert(error.message)
      return
    }
  } else if (action === "delete-dish") {
    const dish = getDish(button.dataset.id)
    if (!dish) return
    if (!window.confirm(`Excluir ${dish.name} de todos os cardápios?`)) return
    try {
      await api(`/dishes/${dish.id}`, { method: "DELETE" })
    } catch (error) {
      window.alert(error.message)
      return
    }
    state.catalog = state.catalog.filter((item) => item.id !== dish.id)
    state.menu.forEach((day) => {
      day.ids = day.ids.filter((id) => id !== dish.id)
    })
    state.editingDish = null
  } else if (action === "notice") {
    window.alert("Função disponível na próxima etapa do protótipo.")
    return
  }
  render()
})

app.addEventListener("submit", async (event) => {
  event.preventDefault()
  const form = event.target
  const data = new FormData(form)

  if (form.id === "auth-form") {
    const email = String(data.get("email") || "")
    const password = String(data.get("password") || "")
    const error = form.querySelector("#auth-error")
    if (!email.includes("@") || password.length < 8) {
      error.textContent =
        "Informe um e-mail válido e uma senha com pelo menos 8 caracteres."
      return
    }

    let requestBody = { email, password }
    if (state.authMode === "register") {
      const confirmPassword = String(data.get("confirmPassword") || "")
      if (password !== confirmPassword) {
        error.textContent = "As senhas informadas não são iguais."
        return
      }
      requestBody = {
        name: String(data.get("name") || "").trim(),
        email,
        password,
        role: String(data.get("role") || "aluno"),
      }
    }
    try {
      const endpoint = state.authMode === "register" ? "/auth/register" : "/auth/login"
      const session = await api(endpoint, {
        method: "POST",
        body: JSON.stringify(requestBody),
      })
      storeToken(session.token, Boolean(data.get("remember")))
      state.profile = session.user
      await loadApplicationData()
      state.apiError = ""
      state.authenticated = true
      render()
    } catch (requestError) {
      clearToken()
      state.authenticated = false
      error.textContent = requestError.message
    }
    return
  }

  if (form.id === "dish-form") {
    const id = form.dataset.id
    const split = (value) =>
      String(value || "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    const dish = {
      name: String(data.get("name")).trim(),
      category: String(data.get("category")),
      calories: Number(data.get("calories")),
      protein: Number(data.get("protein")),
      carbs: Number(data.get("carbs")),
      fat: Number(data.get("fat")),
      fiber: Number(data.get("fiber")),
      description: String(data.get("description")).trim(),
      image:
        String(data.get("image")).trim() ||
        "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=800&h=500&fit=crop&auto=format",
      allergens: split(data.get("allergens")),
      tags: split(data.get("tags")),
    }
    const existing = Boolean(id)
    const error = form.querySelector("#dish-error")
    try {
      const savedDish = await api(
        existing ? `/dishes/${id}` : "/dishes",
        {
          method: existing ? "PUT" : "POST",
          body: JSON.stringify(dish),
        },
      )
      state.catalog = existing
        ? state.catalog.map((item) => (item.id === id ? savedDish : item))
        : [...state.catalog, savedDish]

      if (!existing) {
        const day = state.menu[state.selectedDay]
        const ids = [...day.ids, savedDish.id]
        try {
          await api(`/menu/${day.date}`, {
            method: "PUT",
            body: JSON.stringify({ dishIds: ids }),
          })
          day.ids = ids
        } catch (menuError) {
          state.editingDish = null
          render()
          window.alert(`Prato salvo, mas não foi possível adicioná-lo ao dia: ${menuError.message}`)
          return
        }
      }

      state.editingDish = null
      render()
    } catch (requestError) {
      error.textContent = requestError.message
    }
  }
})

async function initialize() {
  if (getToken()) {
    try {
      state.profile = await api("/auth/me")
      await loadApplicationData()
      state.authenticated = true
    } catch (error) {
      clearToken()
      state.apiError = error.message
    }
  }
  render()
}

initialize()
