/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import { ROUTES_PATH } from "../constants/routes.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "test@test.com" })
      )
      document.body.innerHTML = NewBillUI()
    })

    test("Then form should be displayed with all required fields", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
      expect(screen.getByTestId("expense-type")).toBeTruthy()
      expect(screen.getByTestId("expense-name")).toBeTruthy()
      expect(screen.getByTestId("amount")).toBeTruthy()
      expect(screen.getByTestId("vat")).toBeTruthy()
      expect(screen.getByTestId("pct")).toBeTruthy()
      expect(screen.getByTestId("commentary")).toBeTruthy()
      expect(screen.getByTestId("datepicker")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
    })

    describe("NewBill constructor", () => {
      test("Should initialize NewBill container", () => {
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })
        expect(newBill.document).toBe(document)
        expect(newBill.onNavigate).toBe(onNavigate)
        expect(newBill.store).toBe(mockStore)
        expect(newBill.fileUrl).toBeNull()
        expect(newBill.fileName).toBeNull()
        expect(newBill.billId).toBeNull()
      })

      test("Should attach event listeners to form and file input", () => {
        const form = document.querySelector(`form[data-testid="form-new-bill"]`)
        const fileInput = document.querySelector(`input[data-testid="file"]`)
        const addEventListenerSpy = jest.spyOn(form, "addEventListener")
        const fileAddEventListenerSpy = jest.spyOn(fileInput, "addEventListener")

        new NewBill({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
        })

        expect(addEventListenerSpy).toHaveBeenCalledWith(
          "submit",
          expect.any(Function)
        )
        expect(fileAddEventListenerSpy).toHaveBeenCalledWith(
          "change",
          expect.any(Function)
        )
      })
    })

    describe("handleChangeFile", () => {
      test("Should upload file with valid extension (jpg)", async () => {
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        const fileInput = screen.getByTestId("file")
        const file = new File(["test"], "test.jpg", { type: "image/jpeg" })

        await userEvent.upload(fileInput, file)

        await waitFor(() => {
          expect(newBill.fileName).toBe("test.jpg")
          expect(newBill.fileUrl).toBeTruthy()
          expect(newBill.billId).toBeTruthy()
        })
      })

      test("Should upload file with valid extension (png)", async () => {
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        const fileInput = screen.getByTestId("file")
        const file = new File(["test"], "test.png", { type: "image/png" })

        await userEvent.upload(fileInput, file)

        await waitFor(() => {
          expect(newBill.fileName).toBe("test.png")
          expect(newBill.fileUrl).toBeTruthy()
        })
      })

      test("Should upload file with valid extension (jpeg)", async () => {
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        const fileInput = screen.getByTestId("file")
        const file = new File(["test"], "test.jpeg", { type: "image/jpeg" })

        await userEvent.upload(fileInput, file)

        await waitFor(() => {
          expect(newBill.fileName).toBe("test.jpeg")
        })
      })

      test("Should reject file with invalid extension (pdf)", async () => {
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        const fileInput = screen.getByTestId("file")
        const file = new File(["test"], "test.pdf", { type: "application/pdf" })

        window.alert = jest.fn()

        await userEvent.upload(fileInput, file)

        expect(window.alert).toHaveBeenCalledWith(
          "Veuillez sélectionner un fichier de type JPG, JPEG ou PNG."
        )
        expect(fileInput.value).toBe("")
      })

      test("Should reject file with invalid extension (txt)", async () => {
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        const fileInput = screen.getByTestId("file")
        const file = new File(["test"], "test.txt", { type: "text/plain" })

        window.alert = jest.fn()

        await userEvent.upload(fileInput, file)

        expect(window.alert).toHaveBeenCalled()
        expect(fileInput.value).toBe("")
      })

      test("Should handle file upload error", async () => {
        const errorStore = {
          bills: jest.fn(() => ({
            create: () => Promise.reject(new Error("Upload failed")),
            update: () => Promise.resolve({}),
            list: () => Promise.resolve([]),
          })),
        }

        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: errorStore,
          localStorage: window.localStorage,
        })

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

        const fileInput = screen.getByTestId("file")
        const file = new File(["test"], "test.jpg", { type: "image/jpeg" })

        await userEvent.upload(fileInput, file)

        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              message: "Upload failed",
            })
          )
        })

        consoleErrorSpy.mockRestore()
      })

      test("Should do nothing when no file is selected", () => {
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        const fileInput = screen.getByTestId("file")
        const event = new Event("change", { bubbles: true })

        fileInput.dispatchEvent(event)

        expect(newBill.fileUrl).toBeNull()
        expect(newBill.fileName).toBeNull()
      })
    })

    describe("handleSubmit", () => {
      test("Should submit form with all required fields and navigate to Bills", async () => {
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        newBill.fileUrl = "https://test.com/test.jpg"
        newBill.fileName = "test.jpg"
        newBill.billId = "123"

        const form = screen.getByTestId("form-new-bill")
        screen.getByTestId("expense-type").value = "Restaurants et bars"
        screen.getByTestId("expense-name").value = "Test Bill"
        screen.getByTestId("amount").value = "100"
        screen.getByTestId("datepicker").value = "2024-01-01"
        screen.getByTestId("vat").value = "20"
        screen.getByTestId("pct").value = "20"
        screen.getByTestId("commentary").value = "Test commentary"

        const submitSpy = jest.spyOn(newBill, "updateBill")

        form.dispatchEvent(new Event("submit"))

        expect(submitSpy).toHaveBeenCalled()
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"])
      })

      test("Should use default pct value of 20 if not provided", async () => {
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        newBill.fileUrl = "https://test.com/test.jpg"
        newBill.fileName = "test.jpg"
        newBill.billId = "123"

        const form = screen.getByTestId("form-new-bill")
        screen.getByTestId("expense-type").value = "Restaurants et bars"
        screen.getByTestId("expense-name").value = "Test Bill"
        screen.getByTestId("amount").value = "100"
        screen.getByTestId("datepicker").value = "2024-01-01"
        screen.getByTestId("vat").value = "20"
        screen.getByTestId("pct").value = ""
        screen.getByTestId("commentary").value = "Test commentary"

        const updateBillSpy = jest.spyOn(newBill, "updateBill")

        const form2 = document.querySelector(`form[data-testid="form-new-bill"]`)
        form2.dispatchEvent(new Event("submit"))

        const billArg = updateBillSpy.mock.calls[0][0]
        expect(billArg.pct).toBe(20)
      })

      test("Should build bill object with status pending", async () => {
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        newBill.fileUrl = "https://test.com/test.jpg"
        newBill.fileName = "test.jpg"
        newBill.billId = "123"

        const form = document.querySelector(`form[data-testid="form-new-bill"]`)
        const expenseType = document.querySelector(`select[data-testid="expense-type"]`)
        const expenseName = document.querySelector(`input[data-testid="expense-name"]`)
        const amount = document.querySelector(`input[data-testid="amount"]`)
        const datepicker = document.querySelector(`input[data-testid="datepicker"]`)
        const vat = document.querySelector(`input[data-testid="vat"]`)
        const pct = document.querySelector(`input[data-testid="pct"]`)
        const commentary = document.querySelector(`textarea[data-testid="commentary"]`)

        expenseType.value = "Restaurants et bars"
        expenseName.value = "Test Bill"
        amount.value = "100"
        datepicker.value = "2024-01-01"
        vat.value = "20"
        pct.value = "20"
        commentary.value = "Test commentary"

        const updateBillSpy = jest.spyOn(newBill, "updateBill")

        form.dispatchEvent(new Event("submit"))

        const billArg = updateBillSpy.mock.calls[0][0]
        expect(billArg.type).toBe("Restaurants et bars")
        expect(billArg.name).toBe("Test Bill")
        expect(billArg.amount).toBe(100)
        expect(billArg.date).toBe("2024-01-01")
        expect(billArg.vat).toBe("20")
        expect(billArg.pct).toBe(20)
        expect(billArg.commentary).toBe("Test commentary")
        expect(billArg.fileUrl).toBe("https://test.com/test.jpg")
        expect(billArg.fileName).toBe("test.jpg")
        expect(billArg.status).toBe("pending")
      })
    })

    describe("updateBill", () => {
      test("Should update bill when store exists", async () => {
        const onNavigate = jest.fn()
        const updateSpy = jest.fn(() => Promise.resolve({}))
        const storeWithUpdate = {
          bills: jest.fn(() => ({
            update: updateSpy,
          })),
        }

        const newBill = new NewBill({
          document,
          onNavigate,
          store: storeWithUpdate,
          localStorage: window.localStorage,
        })

        newBill.billId = "123"

        const bill = {
          email: "test@test.com",
          type: "Restaurants et bars",
          name: "Test",
          amount: 100,
          date: "2024-01-01",
          vat: "20",
          pct: 20,
          commentary: "Test",
          fileUrl: "url",
          fileName: "file",
          status: "pending",
        }

        newBill.updateBill(bill)

        await waitFor(() => {
          expect(updateSpy).toHaveBeenCalledWith({
            data: JSON.stringify(bill),
            selector: "123",
          })
        })
      })

      test("Should not update bill when store is null", async () => {
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        })

        const bill = {
          email: "test@test.com",
          type: "Restaurants et bars",
          name: "Test",
          amount: 100,
          date: "2024-01-01",
          vat: "20",
          pct: 20,
          commentary: "Test",
          fileUrl: "url",
          fileName: "file",
          status: "pending",
        }

        newBill.updateBill(bill)

        expect(onNavigate).not.toHaveBeenCalledWith(ROUTES_PATH["Bills"])
      })

      test("Should handle update error", async () => {
        const onNavigate = jest.fn()
        const updateSpy = jest.fn(() =>
          Promise.reject(new Error("Update failed"))
        )
        const storeWithError = {
          bills: jest.fn(() => ({
            update: updateSpy,
          })),
        }

        const newBill = new NewBill({
          document,
          onNavigate,
          store: storeWithError,
          localStorage: window.localStorage,
        })

        newBill.billId = "123"

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

        const bill = {
          email: "test@test.com",
          type: "Restaurants et bars",
          name: "Test",
          amount: 100,
          date: "2024-01-01",
          vat: "20",
          pct: 20,
          commentary: "Test",
          fileUrl: "url",
          fileName: "file",
          status: "pending",
        }

        newBill.updateBill(bill)

        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Update failed" })
          )
        })

        consoleErrorSpy.mockRestore()
      })
    })
  })
})
