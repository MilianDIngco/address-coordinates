const fileUpload = document.getElementById("excelFile");
const sheetOptions = document.getElementById("sheetOptions");
const headerTable = document.getElementById("headerTable");

let workbook = null;

sheetOptions.addEventListener('change', function(event) {
    if (workbook) {
        let sheetOption = event.target.value;
        let worksheet = workbook.Sheets[sheetOption];

        let jsonSheet = XLSX.utils.sheet_to_json(worksheet);
        
        // Get headers
        let headers = Object.keys(jsonSheet[0]);
        setHeaderOrder(headers);
    }
});

fileUpload.addEventListener('change', async function(event) {
    if (event.target.files.length > 0) {
        let file = event.target.files[0];

        if (!file) {
            // clear file input
            event.target.value = '';
            alert("Please upload an excel file");
            return;
        }
        if (!(file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
            // clear file input
            event.target.value = '';
            alert("Please select an excel file");            
            return;
        }

        const reader = new FileReader();

        try {
            workbook = await getWorkbook(reader, file);
            setSheetOptions(workbook.SheetNames);
        } catch(error) {
            console.error("ERROR: ", error);
        }      
    }
});

function getWorkbook(reader, file) {
    return new Promise((resolve, reject) => {
        reader.onload = function(event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data);
            if (workbook) {
                resolve(workbook);
            } else {
                reject("Failed to get workbook");
            }
        }

        reader.onerror = function() {
            reject("File reading error");
        }
    
        reader.readAsArrayBuffer(file);
    });
    
}

function setSheetOptions(sheetNames) {
    sheetOptions.innerHTML = '';
    // Set default option
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.text = "Select a sheet";
    sheetOptions.appendChild(defaultOption);

    // Create options for each sheet
    sheetNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.text = name;
        sheetOptions.appendChild(option);
    });
}

function setHeaderOrder(headers) {
    console.log(headers);
    headerTable.innerHTML = '';

    let count = 1;
    headers.forEach(header => {
        // Create table row
        const tableRow = document.createElement('tr');

        // Create element for header table header
        const headerLabel = document.createElement('th');
        headerLabel.textContent = header;
        tableRow.appendChild(headerLabel);

        // Create number table header
        const orderHeader = document.createElement('th');
        
        // Create number input
        const numberInput = document.createElement('input');
        numberInput.type = "number";
        numberInput.placeholder = `Order ${count++}`;
        numberInput.required = true;

        orderHeader.appendChild(numberInput);
        tableRow.appendChild(orderHeader);

        headerTable.appendChild(tableRow);
    })
}
