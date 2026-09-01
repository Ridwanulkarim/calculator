class Calculator {
    constructor(displayElement, expressionElement, clearBtnElements) {
        this.displayElement = displayElement;
        this.expressionElement = expressionElement;
        this.clearBtnElements = clearBtnElements;
        this.currentMode = 'basic';
        this.currentBase = 16;
        this.showBinary = true;
        this.rpnMode = false;
        this.rpnStack = [];
        this.is2nd = false;
        this.isRad = true;
        this.memory = 0;
        this.reset();
    }

    reset() {
        this.currentValue = '0';
        this.previousValue = null;
        this.operator = null;
        this.expressionStr = '';
        this.awaitingNextOperand = false;
        this.lastOperator = null;
        this.lastOperand = null;
        this.rpnStack = [];
        this.updateDisplay();
        this.updateClearBtnText();
        this.clearActiveOperator();
    }

    clear() {
        if (this.currentValue !== '0' || this.awaitingNextOperand) {
            this.currentValue = '0';
            this.updateClearBtnText();
            this.updateDisplay();
        } else {
            this.reset();
        }
    }

    backspace() {
        if (this.awaitingNextOperand) return;

        if (this.currentValue.length > 1 && this.currentValue !== 'Error') {
            this.currentValue = this.currentValue.slice(0, -1);
            if (this.currentValue === '-' || this.currentValue === '') {
                this.currentValue = '0';
            }
        } else {
            this.currentValue = '0';
        }
        this.updateClearBtnText();
        this.updateDisplay();
    }

    updateClearBtnText() {
        if (this.clearBtnElements) {
            const txt = (this.currentValue !== '0' || this.awaitingNextOperand) ? 'C' : 'AC';
            this.clearBtnElements.forEach(btn => btn.textContent = txt);
        }
    }

    inputDigit(digit) {
        this.clearActiveOperator();

        if (this.awaitingNextOperand) {
            this.currentValue = digit;
            this.awaitingNextOperand = false;
        } else {
            if (this.currentValue === '0') {
                this.currentValue = digit;
            } else {
                if (this.currentValue.replace(/[^0-9A-Fa-f]/g, '').length < 16) {
                    this.currentValue += digit;
                }
            }
        }
        this.updateClearBtnText();
        this.updateDisplay();
    }

    inputDecimal() {
        if (this.currentMode === 'programmer') return;
        this.clearActiveOperator();

        if (this.awaitingNextOperand) {
            this.currentValue = '0.';
            this.awaitingNextOperand = false;
        } else if (!this.currentValue.includes('.')) {
            this.currentValue += '.';
        }
        this.updateClearBtnText();
        this.updateDisplay();
    }

    toggleSign() {
        if (this.currentValue === '0' || this.currentValue === 'Error') return;
        if (this.currentValue.startsWith('-')) {
            this.currentValue = this.currentValue.slice(1);
        } else {
            this.currentValue = '-' + this.currentValue;
        }
        this.updateDisplay();
    }

    percent() {
        let num = parseFloat(this.currentValue);
        if (isNaN(num)) return;
        this.expressionStr = `${this.formatNumber(this.currentValue)}%`;
        this.currentValue = this.formatResult(num / 100);
        this.updateDisplay();
    }

    handleRPN(action) {
        if (!this.rpnMode) return;
        let val = parseFloat(this.currentValue);

        switch (action) {
            case 'swap':
                if (this.rpnStack.length >= 2) {
                    let y = this.rpnStack.pop();
                    let x = this.rpnStack.pop();
                    this.rpnStack.push(y);
                    this.rpnStack.push(x);
                    this.currentValue = this.formatResult(x);
                } else if (this.rpnStack.length === 1 && !isNaN(val)) {
                    let y = val;
                    let x = this.rpnStack.pop();
                    this.rpnStack.push(y);
                    this.currentValue = this.formatResult(x);
                }
                break;
            case 'rolldown':
                if (this.rpnStack.length > 1) {
                    let top = this.rpnStack.pop();
                    this.rpnStack.unshift(top);
                    this.currentValue = this.formatResult(this.rpnStack[this.rpnStack.length - 1]);
                }
                break;
            case 'rollup':
                if (this.rpnStack.length > 1) {
                    let bot = this.rpnStack.shift();
                    this.rpnStack.push(bot);
                    this.currentValue = this.formatResult(this.rpnStack[this.rpnStack.length - 1]);
                }
                break;
            case 'drop':
                if (this.rpnStack.length > 0) {
                    this.rpnStack.pop();
                    this.currentValue = this.rpnStack.length > 0 
                        ? this.formatResult(this.rpnStack[this.rpnStack.length - 1]) 
                        : '0';
                } else {
                    this.currentValue = '0';
                }
                break;
        }

        this.awaitingNextOperand = true;
        this.updateDisplay();
    }

    handleProgrammer(op) {
        let val = parseInt(this.currentValue, this.currentBase);
        if (isNaN(val)) return;

        let res = 0;
        switch (op) {
            case 'NOT': res = ~val; this.expressionStr = `NOT(${this.currentValue})`; break;
            case 'NEG': res = -val; this.expressionStr = `NEG(${this.currentValue})`; break;
            case 'shl': res = val << 1; this.expressionStr = `${this.currentValue} << 1`; break;
            case 'shr': res = val >> 1; this.expressionStr = `${this.currentValue} >> 1`; break;
            case 'RoL': res = (val << 1) | (val >>> 31); this.expressionStr = `RoL(${this.currentValue})`; break;
            case 'RoR': res = (val >>> 1) | (val << 31); this.expressionStr = `RoR(${this.currentValue})`; break;
            case 'flip8': res = ((val & 0xFF) << 8) | ((val >> 8) & 0xFF); this.expressionStr = `flip8(${this.currentValue})`; break;
            case 'flip16': res = ((val & 0xFFFF) << 16) | ((val >> 16) & 0xFFFF); this.expressionStr = `flip16(${this.currentValue})`; break;
            case 'AND': case 'OR': case 'XOR': case 'NOR': case 'xshl': case 'xshr': case 'mod':
                this.handleOperator(op, null);
                return;
            default: return;
        }

        this.currentValue = res.toString(this.currentBase).toUpperCase();
        this.awaitingNextOperand = true;
        this.updateDisplay();
    }

    handleScientific(type) {
        let val = parseFloat(this.currentValue);
        if (isNaN(val) && type !== 'pi' && type !== 'e' && type !== 'rand') return;

        let res = 0;
        const radFactor = this.isRad ? 1 : (Math.PI / 180);

        switch (type) {
            case 'pi': res = Math.PI; this.expressionStr = 'π'; break;
            case 'e': res = Math.E; this.expressionStr = 'e'; break;
            case 'rand': res = Math.random(); this.expressionStr = 'Rand'; break;
            case 'x2': res = Math.pow(val, 2); this.expressionStr = `${this.formatNumber(val)}²`; break;
            case 'x3': res = Math.pow(val, 3); this.expressionStr = `${this.formatNumber(val)}³`; break;
            case '2x': res = Math.pow(2, val); this.expressionStr = `2^(${this.formatNumber(val)})`; break;
            case 'recip': if (val === 0) return this.displayError(); res = 1 / val; this.expressionStr = `1/(${this.formatNumber(val)})`; break;
            case 'sqrt': if (val < 0) return this.displayError(); res = Math.sqrt(val); this.expressionStr = `√(${this.formatNumber(val)})`; break;
            case 'cbrt': res = Math.cbrt(val); this.expressionStr = `³√(${this.formatNumber(val)})`; break;
            case 'log2': if (val <= 0) return this.displayError(); res = Math.log2(val); this.expressionStr = `log₂(${this.formatNumber(val)})`; break;
            case 'fact': if (val < 0 || !Number.isInteger(val)) return this.displayError(); res = this.factorial(val); this.expressionStr = `${this.formatNumber(val)}!`; break;
            case 'sin': res = this.is2nd ? Math.asin(val) / radFactor : Math.sin(val * radFactor); this.expressionStr = this.is2nd ? `sin⁻¹(${this.formatNumber(val)})` : `sin(${this.formatNumber(val)})`; break;
            case 'cos': res = this.is2nd ? Math.acos(val) / radFactor : Math.cos(val * radFactor); this.expressionStr = this.is2nd ? `cos⁻¹(${this.formatNumber(val)})` : `cos(${this.formatNumber(val)})`; break;
            case 'tan': res = this.is2nd ? Math.atan(val) / radFactor : Math.tan(val * radFactor); this.expressionStr = this.is2nd ? `tan⁻¹(${this.formatNumber(val)})` : `tan(${this.formatNumber(val)})`; break;
            case 'sinh': res = this.is2nd ? Math.asinh(val) : Math.sinh(val); this.expressionStr = this.is2nd ? `sinh⁻¹(${this.formatNumber(val)})` : `sinh(${this.formatNumber(val)})`; break;
            case 'cosh': res = this.is2nd ? Math.acosh(val) : Math.cosh(val); this.expressionStr = this.is2nd ? `cosh⁻¹(${this.formatNumber(val)})` : `cosh(${this.formatNumber(val)})`; break;
            case 'tanh': res = this.is2nd ? Math.atanh(val) : Math.tanh(val); this.expressionStr = this.is2nd ? `tanh⁻¹(${this.formatNumber(val)})` : `tanh(${this.formatNumber(val)})`; break;
            case 'yx': case 'xy': this.handleOperator('^', null); return;
            case 'yroot': this.handleOperator('yroot', null); return;
            case 'logy': this.handleOperator('logy', null); return;
            case 'ee': this.handleOperator('EE', null); return;
            default: return;
        }

        this.currentValue = this.formatResult(res);
        this.awaitingNextOperand = true;
        this.updateDisplay();
    }

    factorial(n) {
        if (n === 0 || n === 1) return 1;
        let res = 1;
        for (let i = 2; i <= n; i++) res *= i;
        return res;
    }

    handleMemory(action) {
        let val = parseFloat(this.currentValue) || 0;
        switch (action) {
            case 'mem-clear': this.memory = 0; break;
            case 'mem-add': this.memory += val; break;
            case 'mem-sub': this.memory -= val; break;
            case 'mem-recall':
                this.currentValue = this.formatResult(this.memory);
                this.awaitingNextOperand = true;
                this.updateDisplay();
                break;
        }
    }

    handleOperator(nextOperator, operatorButton) {
        if (this.rpnMode) {
            let y = parseFloat(this.currentValue);
            let x = this.rpnStack.length > 0 ? this.rpnStack.pop() : y;

            const result = this.calculate(x, y, nextOperator);
            if (result === 'Error') return this.displayError();

            this.currentValue = this.formatResult(result);
            this.rpnStack.push(result);
            this.awaitingNextOperand = true;
            this.updateDisplay();
            return;
        }

        let inputValue = (this.currentMode === 'programmer') 
            ? parseInt(this.currentValue, this.currentBase) 
            : parseFloat(this.currentValue);

        if (this.operator && this.awaitingNextOperand) {
            this.operator = nextOperator;
            this.expressionStr = `${this.formatNumber(this.previousValue)}${this.operator}`;
            this.setActiveOperator(operatorButton);
            this.updateDisplay();
            return;
        }

        if (this.previousValue === null && !isNaN(inputValue)) {
            this.previousValue = inputValue;
        } else if (this.operator) {
            const result = this.calculate(this.previousValue, inputValue, this.operator);
            if (result === 'Error') {
                this.displayError();
                return;
            }
            this.currentValue = (this.currentMode === 'programmer') 
                ? result.toString(this.currentBase).toUpperCase() 
                : this.formatResult(result);
            this.previousValue = (this.currentMode === 'programmer') ? result : parseFloat(this.currentValue);
        }

        this.awaitingNextOperand = true;
        this.operator = nextOperator;
        this.lastOperator = null;
        this.lastOperand = null;
        this.expressionStr = `${this.formatNumber(this.previousValue)}${this.operator}`;
        this.setActiveOperator(operatorButton);
        this.updateDisplay();
    }

    compute() {
        if (this.rpnMode) {
            let val = parseFloat(this.currentValue);
            if (!isNaN(val)) {
                this.rpnStack.push(val);
                this.awaitingNextOperand = true;
                this.updateDisplay();
            }
            return;
        }

        let inputValue = (this.currentMode === 'programmer') 
            ? parseInt(this.currentValue, this.currentBase) 
            : parseFloat(this.currentValue);

        if (this.operator !== null) {
            if (this.awaitingNextOperand && this.lastOperand !== null) {
                inputValue = this.lastOperand;
            } else {
                this.lastOperand = inputValue;
                this.lastOperator = this.operator;
            }

            this.expressionStr = `${this.formatNumber(this.previousValue)}${this.operator}${this.formatNumber(inputValue)}`;

            const result = this.calculate(this.previousValue, inputValue, this.operator);
            if (result === 'Error') {
                this.displayError();
                return;
            }

            this.currentValue = (this.currentMode === 'programmer') 
                ? result.toString(this.currentBase).toUpperCase() 
                : this.formatResult(result);
            this.previousValue = (this.currentMode === 'programmer') ? result : parseFloat(this.currentValue);
            this.operator = null;
            this.awaitingNextOperand = true;
        }

        this.clearActiveOperator();
        this.updateDisplay();
    }

    calculate(first, second, op) {
        switch (op) {
            case '+': return first + second;
            case '-': return first - second;
            case '×':
            case '*': return first * second;
            case '÷':
            case '/':
                if (second === 0) return 'Error';
                return (this.currentMode === 'programmer') ? Math.floor(first / second) : (first / second);
            case 'AND': return (first & second) >>> 0;
            case 'OR': return (first | second) >>> 0;
            case 'XOR': return (first ^ second) >>> 0;
            case 'NOR': return (~(first | second)) >>> 0;
            case 'xshl': return (first << second) >>> 0;
            case 'xshr': return (first >> second) >>> 0;
            case 'mod': return first % second;
            case '^': return Math.pow(first, second);
            default: return second;
        }
    }

    formatResult(number) {
        if (typeof number === 'string') return number;
        if (isNaN(number) || !isFinite(number)) return 'Error';

        const fixed = parseFloat(number.toFixed(10));
        let str = fixed.toString();

        if (str.length > 12) {
            if (Math.abs(fixed) >= 1e12 || (Math.abs(fixed) < 1e-6 && fixed !== 0)) {
                str = fixed.toExponential(4);
            } else {
                str = parseFloat(fixed.toPrecision(10)).toString();
            }
        }
        return str;
    }

    formatNumber(val) {
        if (val === null || val === undefined) return '';
        if (this.currentMode === 'programmer') return val.toString(this.currentBase).toUpperCase();

        const strVal = val.toString();
        if (strVal === 'Error' || strVal.includes('e')) return strVal;
        const parts = strVal.split('.');
        parts[0] = parseInt(parts[0], 10).toLocaleString('en-US') || '0';
        if (strVal.startsWith('-') && parts[0] === '0') parts[0] = '-0';
        return parts.join('.');
    }

    displayError() {
        this.currentValue = 'Error';
        this.previousValue = null;
        this.operator = null;
        this.expressionStr = '';
        this.awaitingNextOperand = true;
        this.updateDisplay();
        this.clearActiveOperator();
    }

    updateDisplay() {
        let displayStr = (this.currentMode === 'programmer') ? this.currentValue.toUpperCase() : this.formatNumber(this.currentValue);
        this.displayElement.textContent = displayStr;

        if (this.expressionElement) {
            if (this.rpnMode) {
                this.expressionElement.textContent = this.rpnStack.length > 0 
                    ? `Stack: [ ${this.rpnStack.map(n => this.formatNumber(n)).join(', ')} ]` 
                    : '';
            } else if (this.operator && !this.awaitingNextOperand) {
                this.expressionElement.textContent = `${this.formatNumber(this.previousValue)}${this.operator}${this.formatNumber(this.currentValue)}`;
            } else {
                this.expressionElement.textContent = this.expressionStr;
            }
        }

        if (this.currentMode === 'programmer') {
            this.updateBinaryGrid();
        }

        const length = displayStr.length;
        if (length > 14) {
            this.displayElement.style.fontSize = '32px';
        } else if (length > 10) {
            this.displayElement.style.fontSize = '44px';
        } else if (length > 7) {
            this.displayElement.style.fontSize = '54px';
        } else {
            this.displayElement.style.fontSize = '64px';
        }
    }

    updateBinaryGrid() {
        const grid = document.getElementById('binary-grid');
        if (!grid) return;

        let num = parseInt(this.currentValue, this.currentBase) || 0;
        let binStr = (BigInt(num) & 0xFFFFFFFFFFFFFFFFn).toString(2).padStart(64, '0');

        const rows = grid.querySelectorAll('.bit-row');
        if (rows.length >= 2) {
            const topSpans = rows[0].querySelectorAll('span');
            for (let i = 0; i < 8; i++) {
                const nibble = binStr.slice(i * 4, (i + 1) * 4);
                if (i === 4) topSpans[i].innerHTML = `${nibble}<sub class="bit-idx">47</sub>`;
                else if (i === 7) topSpans[i].innerHTML = `${nibble}<sub class="bit-idx">32</sub>`;
                else topSpans[i].textContent = nibble;
            }

            const botSpans = rows[1].querySelectorAll('span');
            for (let i = 0; i < 8; i++) {
                const nibble = binStr.slice((i + 8) * 4, (i + 9) * 4);
                if (i === 4) botSpans[i].innerHTML = `${nibble}<sub class="bit-idx">15</sub>`;
                else if (i === 7) botSpans[i].innerHTML = `${nibble}<sub class="bit-idx">0</sub>`;
                else botSpans[i].textContent = nibble;
            }
        }
    }

    setBase(base) {
        let val = parseInt(this.currentValue, this.currentBase) || 0;
        this.currentBase = base;
        this.currentValue = val.toString(base).toUpperCase();
        this.updateDisplay();

        document.querySelectorAll('.key.hex-btn').forEach(btn => {
            btn.disabled = (base !== 16);
        });

        document.querySelectorAll('.key.number').forEach(btn => {
            const num = btn.dataset.number;
            if (num === '8' || num === '9') {
                btn.disabled = (base === 8);
            }
        });
    }

    setActiveOperator(button) {
        this.clearActiveOperator();
        if (button) {
            button.classList.add('active');
        }
    }

    clearActiveOperator() {
        document.querySelectorAll('.key.operator').forEach(btn => btn.classList.remove('active'));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const displayElement = document.getElementById('display');
    const expressionElement = document.getElementById('expression');
    const clearBtnElements = document.querySelectorAll('.clear-btn');
    const calculator = new Calculator(displayElement, expressionElement, clearBtnElements);

    // Keypads
    const basicKeypad = document.getElementById('basic-keypad');
    const scientificKeypad = document.getElementById('scientific-keypad');
    const programmerKeypad = document.getElementById('programmer-keypad');
    const calculatorContainer = document.getElementById('calculator-container');
    const progControls = document.getElementById('prog-controls');
    const binaryGrid = document.getElementById('binary-grid');
    const rpnControls = document.getElementById('rpn-controls');
    const equalsBtns = document.querySelectorAll('.equals-btn');
    const rpnCheck = document.getElementById('rpn-check');

    // Mode dropdown popover control
    const modeBtn = document.getElementById('mode-btn');
    const modeDropdown = document.getElementById('mode-dropdown');

    if (modeBtn && modeDropdown) {
        modeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modeDropdown.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!modeDropdown.contains(e.target) && e.target !== modeBtn) {
                modeDropdown.classList.remove('show');
            }
        });

        // Mode menu selection
        document.querySelectorAll('.menu-item[data-mode]').forEach(item => {
            item.addEventListener('click', () => {
                const selectedMode = item.dataset.mode;
                
                document.querySelectorAll('.menu-item[data-mode]').forEach(el => {
                    const checkSpan = el.querySelector('.check-icon');
                    if (checkSpan) checkSpan.textContent = '';
                    el.classList.remove('active');
                });

                item.querySelector('.check-icon').textContent = '✓';
                item.classList.add('active');
                calculator.currentMode = selectedMode;

                // Hide all keypads first
                basicKeypad.classList.add('hidden');
                scientificKeypad.classList.add('hidden');
                programmerKeypad.classList.add('hidden');

                calculatorContainer.classList.remove('scientific-mode', 'programmer-mode');
                progControls.classList.add('hidden');
                binaryGrid.classList.add('hidden');

                if (selectedMode === 'scientific') {
                    scientificKeypad.classList.remove('hidden');
                    calculatorContainer.classList.add('scientific-mode');
                } else if (selectedMode === 'programmer') {
                    programmerKeypad.classList.remove('hidden');
                    calculatorContainer.classList.add('programmer-mode');
                    progControls.classList.remove('hidden');
                    if (calculator.showBinary) binaryGrid.classList.remove('hidden');
                    calculator.setBase(calculator.currentBase);
                } else {
                    basicKeypad.classList.remove('hidden');
                }

                modeDropdown.classList.remove('show');
            });
        });

        // RPN Mode toggle
        const rpnItem = document.getElementById('rpn-item');
        if (rpnItem && rpnCheck && rpnControls) {
            rpnItem.addEventListener('click', () => {
                calculator.rpnMode = !calculator.rpnMode;
                rpnCheck.textContent = calculator.rpnMode ? '✓' : '';
                
                if (calculator.rpnMode) {
                    rpnControls.classList.remove('hidden');
                    equalsBtns.forEach(btn => btn.textContent = 'enter');
                } else {
                    rpnControls.classList.add('hidden');
                    equalsBtns.forEach(btn => btn.textContent = '=');
                }

                calculator.updateDisplay();
                modeDropdown.classList.remove('show');
            });
        }
    }

    // 2nd button toggle listener
    const btn2nd = document.querySelector('.btn-2nd');
    if (btn2nd) {
        btn2nd.addEventListener('click', () => {
            calculator.is2nd = !calculator.is2nd;
            btn2nd.classList.toggle('active-2nd');
            
            document.querySelectorAll('.trig-btn').forEach(btn => {
                const sci = btn.dataset.sci;
                if (calculator.is2nd) {
                    btn.innerHTML = `${sci}<sup>-1</sup>`;
                } else {
                    btn.textContent = sci;
                }
            });
        });
    }

    // Rad / Deg button toggle listener
    const btnRad = document.querySelector('.btn-rad');
    if (btnRad) {
        btnRad.addEventListener('click', () => {
            calculator.isRad = !calculator.isRad;
            btnRad.textContent = calculator.isRad ? 'Rad' : 'Deg';
        });
    }

    // RPN stack button listeners
    document.querySelectorAll('.key[data-rpn]').forEach(btn => {
        btn.addEventListener('click', () => {
            calculator.handleRPN(btn.dataset.rpn);
        });
    });

    // Programmer radix base selector (8, 10, 16)
    document.querySelectorAll('.seg-btn[data-base]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.seg-btn[data-base]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const base = parseInt(btn.dataset.base, 10);
            calculator.setBase(base);
        });
    });

    // Hex & Programmer button listeners
    document.querySelectorAll('.key[data-hex]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.disabled) calculator.inputDigit(btn.dataset.hex);
        });
    });

    document.querySelectorAll('.key[data-prog]').forEach(btn => {
        btn.addEventListener('click', () => {
            calculator.handleProgrammer(btn.dataset.prog);
        });
    });

    // Scientific keypad buttons
    document.querySelectorAll('.key.scientific').forEach(btn => {
        btn.addEventListener('click', () => {
            const sciType = btn.dataset.sci;
            const action = btn.dataset.action;
            if (sciType) {
                calculator.handleScientific(sciType);
            } else if (action && action.startsWith('mem-')) {
                calculator.handleMemory(action);
            }
        });
    });

    // Generic button click handlers
    document.querySelectorAll('.key').forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.currentTarget;
            const number = target.dataset.number;
            const action = target.dataset.action;
            const operator = target.dataset.operator;

            if (number !== undefined) {
                calculator.inputDigit(number);
            } else if (action === 'decimal') {
                calculator.inputDecimal();
            } else if (action === 'toggle-sign') {
                calculator.toggleSign();
            } else if (action === 'percent') {
                calculator.percent();
            } else if (action === 'clear') {
                calculator.clear();
            } else if (action === 'backspace') {
                calculator.backspace();
            } else if (action === 'operator') {
                calculator.handleOperator(operator, target);
            } else if (action === 'calculate') {
                calculator.compute();
            }
        });
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        const key = e.key;

        if ((key >= '0' && key <= '9') || (calculator.currentMode === 'programmer' && calculator.currentBase === 16 && key.toUpperCase() >= 'A' && key.toUpperCase() <= 'F')) {
            calculator.inputDigit(key.toUpperCase());
        } else if (key === '.') {
            calculator.inputDecimal();
        } else if (key === '+' || key === '-') {
            const opBtn = document.querySelector(`.key.operator[data-operator="${key === '+' ? '+' : '-'}"]`);
            calculator.handleOperator(key, opBtn);
        } else if (key === '*' || key === 'x') {
            const opBtn = document.querySelector(`.key.operator[data-operator="×"]`);
            calculator.handleOperator('×', opBtn);
        } else if (key === '/') {
            e.preventDefault();
            const opBtn = document.querySelector(`.key.operator[data-operator="÷"]`);
            calculator.handleOperator('÷', opBtn);
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            calculator.compute();
        } else if (key === 'Escape') {
            calculator.clear();
        } else if (key === '%') {
            calculator.percent();
        } else if (key === 'Backspace') {
            calculator.backspace();
        }
    });
});
