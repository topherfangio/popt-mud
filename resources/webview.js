const vscode = acquireVsCodeApi();

// Handle button clicks
document.getElementById('toggleMapping').addEventListener('click', () => {
  vscode.postMessage({
    command: 'mapper',
    action: 'toggleMapping'
  });
});

document.getElementById('resetMap').addEventListener('click', () => {
  vscode.postMessage({
    command: 'mapper',
    action: 'reset'
  });
});
