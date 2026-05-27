export const defaultCode = {
    cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello World!\\n\";\n    return 0;\n}",
    python: "print(\"Hello World!\")",
    java: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World!\");\n    }\n}"
};

export let userBoilerplates = JSON.parse(localStorage.getItem('rce_bp')) || {};

window.changeTheme = function() { 
    monaco.editor.setTheme(document.getElementById('tSel').value); 
    if(window.saveState) window.saveState(); 
};

window.changeFont = function() { 
    window.editor.updateOptions({ fontSize: parseInt(document.getElementById('fInp').value) }); 
    if(window.saveState) window.saveState(); 
};

window.openSettings = function() { 
    let l = document.getElementById('lSel').value; 
    document.getElementById('bpText').value = userBoilerplates[l] || defaultCode[l]; 
    document.getElementById('setMod').style.display = "flex"; 
};

window.closeSettings = function() { 
    document.getElementById('setMod').style.display = "none"; 
};

window.saveSettings = function() { 
    let l = document.getElementById('lSel').value; 
    userBoilerplates[l] = document.getElementById('bpText').value; 
    localStorage.setItem('rce_bp', JSON.stringify(userBoilerplates)); 
    window.closeSettings(); 
};