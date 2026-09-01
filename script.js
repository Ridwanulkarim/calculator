class Calculator {
    constructor(displayElement, expressionElement, clearBtnElement) {
        this.displayElement = displayElement;
        this.expressionElement = expressionElement;
        this.clearBtnElement = clearBtnElement;
        this.currentMode = 'basic';
        this.is2nd = false;
        this.isRad = true; // Radians vs Degrees
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
        if (this.clearBtnElement) {
            this.clearBtnElement.textContent = (this.currentValue !== '0' || this.awaitingNextOperand) ? 'C' : 'AC';
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
                if (this.currentValue.replace(/[^0-9]/g, '').length < 12) {
                    this.currentValue += digit;
                }
            }
        }
        this.updateClearBtnText();
        this.updateDisplay();
    }

    inputDecimal() {
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

    // Handle Scientific calculations matching screenshot options
    handleScientific(type) {
        let val = parseFloat(this.currentValue);
        if (isNaN(val) && type !== 'pi' && type !== 'e' && type !== 'rand') return;

        let res = 0;
        const radFactor = this.isRad ? 1 : (Math.PI / 180);

        switch (type) {
            case 'pi':
                res = Math.PI;
                this.expressionStr = 'π';
                break;
            case 'e':
                res = Math.E;
                this.expressionStr = 'e';
                break;
            case 'rand':
                res = Math.random();
                this.expressionStr = 'Rand';
                break;
            case 'x2':
                res = Math.pow(val, 2);
                this.expressionStr = `${this.formatNumber(val)}²`;
                break;
            case 'x3':
                res = Math.pow(val, 3);
                this.expressionStr = `${this.formatNumber(val)}³`;
                break;
            case '2x':
                res = Math.pow(2, val);
                this.expressionStr = `2^(${this.formatNumber(val)})`;
                break;
            case 'recip':
                if (val === 0) return this.displayError();
                res = 1 / val;
                this.expressionStr = `1/(${this.formatNumber(val)})`;
                break;
            case 'sqrt':
                if (val < 0) return this.displayError();
                res = Math.sqrt(val);
                this.expressionStr = `√(${this.formatNumber(val)})`;
                break;
            case 'cbrt':
                res = Math.cbrt(val);
                this.expressionStr = `³√(${this.formatNumber(val)})`;
                break;
            case 'log2':
                if (val <= 0) return this.displayError();
                res = Math.log2(val);
                this.expressionStr = `log₂(${this.formatNumber(val)})`;
                break;
            case 'fact':
                if (val < 0 || !Number.isInteger(val)) return this.displayError();
                res = this.factorial(val);
                this.expressionStr = `${this.formatNumber(val)}!`;
                break;
            case 'sin':
                res = this.is2nd ? Math.asin(val) / radFactor : Math.sin(val * radFactor);
                this.expressionStr = this.is2nd ? `sin⁻¹(${this.formatNumber(val)})` : `sin(${this.formatNumber(val)})`;
                break;
            case 'cos':
                res = this.is2nd ? Math.acos(val) / radFactor : Math.cos(val * radFactor);
                this.expressionStr = this.is2nd ? `cos⁻¹(${this.formatNumber(val)})` : `cos(${this.formatNumber(val)})`;
                break;
            case 'tan':
                res = this.is2nd ? Math.atan(val) / radFactor : Math.tan(val * radFactor);
                this.expressionStr = this.is2nd ? `tan⁻¹(${this.formatNumber(val)})` : `tan(${this.formatNumber(val)})`;
                break;
            case 'sinh':
                res = this.is2nd ? Math.asinh(val) : Math.sinh(val);
                this.expressionStr = this.is2nd ? `sinh⁻¹(${this.formatNumber(val)})` : `sinh(${this.formatNumber(val)})`;
                break;
            case 'cosh':
                res = this.is2nd ? Math.acosh(val) : Math.cosh(val);
                this.expressionStr = this.is2nd ? `cosh⁻¹(${this.formatNumber(val)})` : `cosh(${this.formatNumber(val)})`;
                break;
            case 'tanh':
                res = this.is2nd ? Math.atanh(val) : Math.tanh(val);
                this.expressionStr = this.is2nd ? `tanh⁻¹(${this.formatNumber(val)})` : `tanh(${this.formatNumber(val)})`;
                break;
            case 'yx':
            case 'xy':
                this.handleOperator('^', null);
                return;
            case 'yroot':
                this.handleOperator('yroot', null);
                return;
            case 'logy':
                this.handleOperator('logy', null);
                return;
            case 'ee':
                this.handleOperator('EE', null);
                return;
            default:
                return;
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
        const inputValue = parseFloat(this.currentValue);

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
            this.currentValue = this.formatResult(result);
            this.previousValue = parseFloat(this.currentValue);
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
        let inputValue = parseFloat(this.currentValue);

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

            this.currentValue = this.formatResult(result);
            this.previousValue = parseFloat(this.currentValue);
            this.operator = null;
            this.awaitingNextOperand = true;
        } else if (this.lastOperator && this.lastOperand !== null) {
            this.expressionStr = `${this.formatNumber(inputValue)}${this.lastOperator}${this.formatNumber(this.lastOperand)}`;
            const result = this.calculate(inputValue, this.lastOperand, this.lastOperator);
            if (result === 'Error') {
                this.displayError();
                return;
            }
            this.currentValue = this.formatResult(result);
            this.previousValue = parseFloat(this.currentValue);
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
                return first / second;
            case '^': return Math.pow(first, second);
            case 'yroot': return Math.pow(first, 1 / second);
            case 'logy': return Math.log(first) / Math.log(second);
            case 'EE': return first * Math.pow(10, second);
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
        let displayStr = this.formatNumber(this.currentValue);
        this.displayElement.textContent = displayStr;

        if (this.expressionElement) {
            if (this.operator && !this.awaitingNextOperand) {
                this.expressionElement.textContent = `${this.formatNumber(this.previousValue)}${this.operator}${this.formatNumber(this.currentValue)}`;
            } else {
                this.expressionElement.textContent = this.expressionStr;
            }
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
    const clearBtnElement = document.getElementById('clear-btn');
    const calculator = new Calculator(displayElement, expressionElement, clearBtnElement);

    // Mode dropdown popover control
    const modeBtn = document.getElementById('mode-btn');
    const modeDropdown = document.getElementById('mode-dropdown');
    const calculatorContainer = document.getElementById('calculator-container');
    const btn2nd = document.getElementById('btn-2nd');
    const btnRad = document.getElementById('btn-rad');

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

                if (selectedMode === 'scientific') {
                    calculatorContainer.classList.add('scientific-mode');
                } else {
                    calculatorContainer.classList.remove('scientific-mode');
                }

                modeDropdown.classList.remove('show');
            });
        });
    }

    // 2nd button toggle listener
    if (btn2nd) {
        btn2nd.addEventListener('click', () => {
            calculator.is2nd = !calculator.is2nd;
            btn2nd.classList.toggle('active-2nd');
            
            document.querySelectorAll('.trig-btn').forEach(btn => {
                const sci = btn.dataset.sci;
                if (calculator.is2nd) {
                    btn.innerHTML = sci.endsWith('h') ? `${sci}<sup>-1</sup>` : `${sci}<sup>-1</sup>`;
                } else {
                    btn.textContent = sci;
                }
            });
        });
    }

    // Rad / Deg button toggle listener
    if (btnRad) {
        btnRad.addEventListener('click', () => {
            calculator.isRad = !calculator.isRad;
            btnRad.textContent = calculator.isRad ? 'Rad' : 'Deg';
        });
    }

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

    // Basic Keypad button listeners
    document.querySelectorAll('.key:not(.scientific)').forEach(button => {
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

        if (key >= '0' && key <= '9') {
            calculator.inputDigit(key);
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
