import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ShotListUploader from './ShotListUploader';
import * as XLSX from 'xlsx';

// --- Mocking the XLSX library ---
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
  },
  SheetNames: [], // Mock SheetNames property if needed directly on XLSX object
}));

// --- Mocking FileReader ---
// Store the original FileReader
const originalFileReader = global.FileReader;

describe('ShotListUploader', () => {
  let mockOnShotListParsed;
  let mockFileReaderInstance;

  beforeEach(() => {
    // Reset mocks
    mockOnShotListParsed = jest.fn();
    XLSX.read.mockClear();
    XLSX.utils.sheet_to_json.mockClear();

    // Mock FileReader
    mockFileReaderInstance = {
      readAsBinaryString: jest.fn(),
      onload: null,
      onerror: null,
      result: null, // To store mock file content
    };
    global.FileReader = jest.fn(() => mockFileReaderInstance);
  });

  afterEach(() => {
    // Restore original FileReader
    global.FileReader = originalFileReader;
  });

  test('renders the file input and label', () => {
    render(<ShotListUploader onShotListParsed={mockOnShotListParsed} />);
    expect(screen.getByLabelText(/Upload Shot List/i)).toBeInTheDocument();
  });

  test('calls onShotListParsed with parsed data on successful upload', async () => {
    // Mock XLSX functions
    const mockSheetData = [
      ['ItemID', 'ItemColor', 'ViewType', 'Filename'],
      ['SKU001', 'Red', 'Front', 'SKU001_Red_Front.jpg'],
      ['SKU002', 'Blue', 'Side', 'SKU002_Blue_Side.jpg'],
    ];
    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: {},
      },
    };
    XLSX.read.mockReturnValue(mockWorkbook);
    XLSX.utils.sheet_to_json.mockReturnValue(mockSheetData);

    render(<ShotListUploader onShotListParsed={mockOnShotListParsed} />);
    const fileInput = screen.getByLabelText(/Upload Shot List/i);

    // Create a mock file
    const mockFile = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Check if readAsBinaryString was called
    expect(mockFileReaderInstance.readAsBinaryString).toHaveBeenCalledWith(mockFile);

    // Simulate FileReader onload **wrapped in act**
    mockFileReaderInstance.result = 'binary file data';
    act(() => {
      mockFileReaderInstance.onload({ target: { result: mockFileReaderInstance.result } });
    });

    // Wait for promises to resolve and state updates
    await waitFor(() => {
        // Check if XLSX functions were called correctly
        expect(XLSX.read).toHaveBeenCalledWith('binary file data', { type: 'binary' });
        expect(XLSX.utils.sheet_to_json).toHaveBeenCalledWith(mockWorkbook.Sheets.Sheet1, { header: 1 });

        // Check if the callback was called with the expected data structure
        expect(mockOnShotListParsed).toHaveBeenCalledTimes(1);
        expect(mockOnShotListParsed).toHaveBeenCalledWith([
          { key: 'shot-0', itemID: 'SKU001', itemColor: 'Red', viewType: 'Front', filename: 'SKU001_Red_Front.jpg' },
          { key: 'shot-1', itemID: 'SKU002', itemColor: 'Blue', viewType: 'Side', filename: 'SKU002_Blue_Side.jpg' },
        ]);

        // Check that no error message is shown
        expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    });
  });

  test('displays an error message if parsing fails (e.g., missing headers)', async () => {
    // Mock XLSX functions to simulate missing header
    const mockSheetData = [
      ['ItemID', 'ViewType', 'Filename'], // Missing ItemColor
      ['SKU001', 'Front', 'SKU001_Front.jpg'],
    ];
     const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: {},
      },
    };
    XLSX.read.mockReturnValue(mockWorkbook);
    XLSX.utils.sheet_to_json.mockReturnValue(mockSheetData);

    render(<ShotListUploader onShotListParsed={mockOnShotListParsed} />);
    const fileInput = screen.getByLabelText(/Upload Shot List/i);
    const mockFile = new File(['dummy'], 'bad_headers.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Simulate FileReader onload **wrapped in act**
    mockFileReaderInstance.result = 'binary data';
    act(() => {
        mockFileReaderInstance.onload({ target: { result: mockFileReaderInstance.result } });
    });

    await waitFor(() => {
        // Check that the callback was called with an empty array
        expect(mockOnShotListParsed).toHaveBeenCalledWith([]);
        // Check that an error message containing the specific missing column is shown
        expect(screen.getByText(/Error: Failed to parse file: Missing required columns in XLS: itemColor/i)).toBeInTheDocument();
    });
  });

   test('displays an error message if FileReader fails', async () => {
    render(<ShotListUploader onShotListParsed={mockOnShotListParsed} />);
    const fileInput = screen.getByLabelText(/Upload Shot List/i);
    const mockFile = new File(['dummy'], 'error.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Simulate FileReader onerror **wrapped in act**
    const mockError = new Error('Fake read error');
    act(() => {
        mockFileReaderInstance.onerror(mockError);
    });

    await waitFor(() => {
        expect(mockOnShotListParsed).toHaveBeenCalledWith([]);
        expect(screen.getByText(/Error: Failed to read file/i)).toBeInTheDocument();
    });
  });

  // TODO: Add tests for other error conditions (empty sheet, no valid rows, etc.)
  // TODO: Test loading indicator
}); 