export function createUIRoot(): HTMLDivElement {
  const uiRoot = document.createElement('div')
  uiRoot.className = 'ui-layer'
  uiRoot.setAttribute('aria-label', 'game ui overlay')
  return uiRoot
}
