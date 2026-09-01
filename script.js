class Calculator {
    constructor(displayElement, expressionElement, clearBtnElement) {
        this.displayElement = displayElement;
        this.expressionElement = expressionElement;
        this.clearBtnElement = clearBtnElement;
        this.currentMode = 'basic';
        this.rpnMode = false;
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
                if (this.currentValue.replace(/[^0-9]/g, '').length < 9) {
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

    handleScientific(type) {
        let val = parseFloat(this.currentValue);
        if (isNaN(val) && type !== 'pi' && type !== 'e') return;

        let res = 0;
        switch (type) {
            case 'pi':
                res = Math.PI;
                this.expressionStr = 'π';
                break;
            case 'e':
                res = Math.E;
                this.expressionStr = 'e';
                break;
            case 'sin':
                res = Math.sin(val);
                this.expressionStr = `sin(${this.formatNumber(val)})`;
                break;
            case 'cos':
                res = Math.cos(val);
                this.expressionStr = `cos(${this.formatNumber(val)})`;
                break;
            case 'tan':
                res = Math.tan(val);
                this.expressionStr = `tan(${this.formatNumber(val)})`;
                break;
            case 'ln':
                if (val <= 0) return this.displayError();
                res = Math.log(val);
                this.expressionStr = `ln(${this.formatNumber(val)})`;
                break;
            case 'log':
                if (val <= 0) return this.displayError();
                res = Math.log10(val);
                this.expressionStr = `log(${this.formatNumber(val)})`;
                break;
            case 'square':
                res = Math.pow(val, 2);
                this.expressionStr = `${this.formatNumber(val)}²`;
                break;
            case 'sqrt':
                if (val < 0) return this.displayError();
                res = Math.sqrt(val);
                this.expressionStr = `√(${this.formatNumber(val)})`;
                break;
            case 'factorial':
                if (val < 0 || !Number.isInteger(val)) return this.displayError();
                res = this.fact(val);
                this.expressionStr = `${this.formatNumber(val)}!`;
                break;
            case 'power':
                this.handleOperator('^', null);
                return;
            default:
                return;
        }

        this.currentValue = this.formatResult(res);
        this.awaitingNextOperand = true;
        this.updateDisplay();
    }

    fact(n) {
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
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
            default: return second;
        }
    }

    formatResult(number) {
        if (typeof number === 'string') return number;
        if (isNaN(number) || !isFinite(number)) return 'Error';

        const fixed = parseFloat(number.toFixed(10));
        let str = fixed.toString();

        if (str.length > 9) {
            if (Math.abs(fixed) >= 1e9 || (Math.abs(fixed) < 1e-6 && fixed !== 0)) {
                str = fixed.toExponential(4);
            } else {
                str = parseFloat(fixed.toPrecision(8)).toString();
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
        if (length > 9) {
            this.displayElement.style.fontSize = '38px';
        } else if (length > 7) {
            this.displayElement.style.fontSize = '46px';
        } else if (length > 5) {
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
    const scientificKeypad = document.getElementById('scientific-keypad');

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
                    scientificKeypad.classList.remove('hidden');
                    calculatorContainer.classList.add('scientific-mode');
                } else {
                    scientificKeypad.classList.add('hidden');
                    calculatorContainer.classList.remove('scientific-mode');
                }

                modeDropdown.classList.remove('show');
            });
        });

        // RPN Mode toggle
        const rpnItem = document.getElementById('rpn-item');
        const rpnCheck = document.getElementById('rpn-check');
        if (rpnItem && rpnCheck) {
            rpnItem.addEventListener('click', () => {
                calculator.rpnMode = !calculator.rpnMode;
                rpnCheck.textContent = calculator.rpnMode ? '✓' : '';
                modeDropdown.classList.remove('show');
            });
        }
    }

    // Scientific keypad buttons
    document.querySelectorAll('.key.scientific').forEach(btn => {
        btn.addEventListener('click', () => {
            const sciType = btn.dataset.sci;
            calculator.handleScientific(sciType);
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
