
figma.showUI(__html__, { width: 600, height: 600 });

figma.on('selectionchange', informUIAboutSelection);
informUIAboutSelection();

// figma.ui.onmessage = (msg) => {
//
// };






//======================================================================================================================
function informUIAboutSelection() {
    if (figma.currentPage.selection.length === 1) {
        const selected = figma.currentPage.selection[0];
        if (selected.type === 'COMPONENT_SET') {
            figma.ui.postMessage({ key: 'valid-selection', value: selected.children });
        } else if (selected.type === 'COMPONENT') {
            figma.ui.postMessage({ key: 'valid-selection', value: [selected] });
        }
    } else {
        figma.ui.postMessage({ key: 'invalid-selection' });
    }
}