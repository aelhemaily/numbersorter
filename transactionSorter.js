document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const convertBtn = document.getElementById('convertBtn');
    const outputDiv = document.getElementById('output');
    const toolbar = document.getElementById('toolbar');
    const copyDebitColBtn = document.getElementById('copyDebitColBtn');
    const copyCreditColBtn = document.getElementById('copyCreditColBtn');
    const copyBothColsBtn = document.getElementById('copyBothColsBtn');

    /**
     * Parse a number from a string that may contain:
     * - Dollar signs ($) anywhere (ignored)
     * - Parentheses for negative values, e.g., (34.34) or ($34.43)
     * - Commas as thousand separators (ignored)
     * - Standard negative sign (-)
     * 
     * @param {string} str - The raw string to parse
     * @returns {number|null} - Parsed number or null if invalid
     */
    function parseNumberFromString(str) {
        if (!str || typeof str !== 'string') return null;
        
        let cleaned = str.trim();
        if (cleaned === '') return null;
        
        // Check if it's a negative number in parentheses
        // Matches patterns like (123.45), ($123.45), (123.45$), etc.
        const parenthesesMatch = cleaned.match(/^\(\s*\$?\s*([\d,]+\.?\d*)\s*\$?\s*\)$/);
        if (parenthesesMatch) {
            // This is a negative number
            let numberPart = parenthesesMatch[1];
            // Remove commas
            numberPart = numberPart.replace(/,/g, '');
            const num = parseFloat(numberPart);
            return isNaN(num) ? null : -Math.abs(num);
        }
        
        // Remove ALL dollar signs ($) from the string
        cleaned = cleaned.replace(/\$/g, '');
        
        // Remove commas (thousand separators)
        cleaned = cleaned.replace(/,/g, '');
        
        // Now try to parse as a regular number
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
    }

    /**
     * Format a number for display (no dollar signs, proper decimal places)
     * @param {number} num - The number to format
     * @returns {string} - Formatted number string
     */
    function formatNumber(num) {
        if (num === null || isNaN(num)) return '';
        return num.toFixed(2);
    }

    // Helper function to show toasts (reused from original main.js)
    function showToast(message, type = 'success') {
        const toast = document.getElementById(type === 'error' ? 'error-toast' : 'toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        toast.classList.remove('error', 'success');
        if (type === 'error') {
            toast.classList.add('error');
            setTimeout(() => toast.classList.remove('show'), 5000);
        } else {
            toast.classList.add('success');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }

    convertBtn.addEventListener('click', () => {
        const input = inputText.value.trim();
        if (!input) {
            showToast("Please paste numbers into the text area!", "error");
            outputDiv.innerHTML = ''; // Clear previous output
            toolbar.classList.remove('show'); // Hide toolbar
            return;
        }

        // Split by lines and parse each line
        const lines = input.split('\n');
        const validNumbers = [];
        const invalidLines = [];

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') return; // Skip empty lines
            
            const parsed = parseNumberFromString(trimmedLine);
            if (parsed !== null && !isNaN(parsed)) {
                validNumbers.push(parsed);
            } else {
                invalidLines.push(index + 1); // Track line numbers that failed
            }
        });

        if (validNumbers.length === 0) {
            let errorMsg = "No valid numbers found in the input.";
            if (invalidLines.length > 0) {
                errorMsg += ` Invalid format on line(s): ${invalidLines.join(', ')}.`;
            }
            showToast(errorMsg, "error");
            outputDiv.innerHTML = '';
            toolbar.classList.remove('show');
            return;
        }

        // Show warning if some lines were invalid
        if (invalidLines.length > 0) {
            showToast(`Warning: Skipped ${invalidLines.length} invalid line(s) (lines ${invalidLines.join(', ')}).`, 'error');
        }

        let tableHtml = '<table><thead><tr><th>Debit</th><th>Credit</th></tr></thead><tbody>';

        validNumbers.forEach(num => {
            tableHtml += '<tr>';
            if (num >= 0) {
                // Positive number goes to Debit column
                tableHtml += `<td>${formatNumber(num)}</td>`;
                tableHtml += `<td></td>`; // Empty Credit
            } else {
                // Negative number goes to Credit column (as positive value)
                tableHtml += `<td></td>`; // Empty Debit
                tableHtml += `<td>${formatNumber(Math.abs(num))}</td>`;
            }
            tableHtml += '</tr>';
        });

        tableHtml += '</tbody></table>';
        outputDiv.innerHTML = tableHtml;
        toolbar.classList.add('show');
    });

    copyDebitColBtn.addEventListener('click', () => {
        const table = outputDiv.querySelector('table');
        if (!table) {
            showToast("No table to copy from.", "error");
            return;
        }
        const debitColumnData = Array.from(table.rows).slice(1).map(row => row.cells[0].textContent.trim()).join('\n');
        navigator.clipboard.writeText(debitColumnData)
            .then(() => showToast('Debit column copied!'))
            .catch(err => {
                console.error('Failed to copy debit column:', err);
                showToast('Failed to copy debit column.', 'error');
            });
    });

    copyCreditColBtn.addEventListener('click', () => {
        const table = outputDiv.querySelector('table');
        if (!table) {
            showToast("No table to copy from.", "error");
            return;
        }
        const creditColumnData = Array.from(table.rows).slice(1).map(row => row.cells[1].textContent.trim()).join('\n');
        navigator.clipboard.writeText(creditColumnData)
            .then(() => showToast('Credit column copied!'))
            .catch(err => {
                console.error('Failed to copy credit column:', err);
                showToast('Failed to copy credit column.', 'error');
            });
    });

    copyBothColsBtn.addEventListener('click', () => {
        const table = outputDiv.querySelector('table');
        if (!table) {
            showToast("No table to copy from.", "error");
            return;
        }
        const rows = Array.from(table.rows).slice(1); // Skip header row
        const tableData = rows.map(row => {
            const debit = row.cells[0].textContent.trim();
            const credit = row.cells[1].textContent.trim();
            return `${debit}\t${credit}`; // Tab-separated for easy pasting into spreadsheets
        }).join('\n');

        navigator.clipboard.writeText(tableData)
            .then(() => showToast('Both columns copied!'))
            .catch(err => {
                console.error('Failed to copy both columns:', err);
                showToast('Failed to copy both columns.', 'error');
            });
    });

    // Dark Mode Toggle (Reused from original main.js)
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        });
    }

    // Return to Top Button (Reused from original main.js)
    const returnToTopButton = document.getElementById('returnToTop');
    if (returnToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) { // Show button after scrolling down 200px
                returnToTopButton.classList.add('show');
            } else {
                returnToTopButton.classList.remove('show');
            }
        });
        returnToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
