/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import Bills from "../containers/Bills.js"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe("Bills constructor", () => {
      test("Should initialize Bills container when button and icons exist", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const onNavigate = jest.fn()
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })
        expect(billsContainer.document).toBe(document)
        expect(billsContainer.onNavigate).toBe(onNavigate)
        expect(billsContainer.store).toBe(mockStore)
      })

      test("Should handle missing button element without error", () => {
        document.body.innerHTML = "<div></div>"
        const onNavigate = jest.fn()
        expect(() => {
          new Bills({
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage,
          })
        }).not.toThrow()
      })

      test("Should handle missing icon-eye elements without error", () => {
        document.body.innerHTML = BillsUI({ data: [] })
        const onNavigate = jest.fn()
        expect(() => {
          new Bills({
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage,
          })
        }).not.toThrow()
      })
    })

    describe("handleClickNewBill", () => {
      test("Should navigate to NewBill page when new bill button is clicked", () => {
        document.body.innerHTML = BillsUI({ data: [] })
        const onNavigate = jest.fn()
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })
        const newBillButton = screen.getByTestId("btn-new-bill")
        newBillButton.click()
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
      })
    })

    describe("handleClickIconEye", () => {
      test("Should display modal with bill image when icon eye is clicked", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const onNavigate = jest.fn()
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })
        $.fn.modal = jest.fn()
        const firstEye = screen.getAllByTestId("icon-eye")[0]
        billsContainer.handleClickIconEye(firstEye)
        expect($.fn.modal).toHaveBeenCalledWith("show")
        const img = document.querySelector(".bill-proof-container img")
        expect(img).toBeTruthy()
      })

      test("Should set correct image width in modal", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        $.fn.modal = jest.fn()
        $.fn.width = jest.fn(() => 800)
        const onNavigate = jest.fn()
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })
        const firstEye = screen.getAllByTestId("icon-eye")[0]
        billsContainer.handleClickIconEye(firstEye)
        const img = document.querySelector(".bill-proof-container img")
        expect(img.width).toBe(400)
      })
    })

    describe("getBills", () => {
      test("Should return bills from store when store exists", async () => {
        const billsContainer = new Bills({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
        })
        const billsList = await billsContainer.getBills()
          expect(billsList).toHaveLength(bills.length)
          expect(billsList[0]).toMatchObject({
          date: expect.any(String),
          status: expect.any(String),
        })
      })

      test("Should return undefined when store is null", () => {
        const billsContainer = new Bills({
          document,
          onNavigate: jest.fn(),
          store: null,
          localStorage: window.localStorage,
        })
        const billsList = billsContainer.getBills()
        expect(billsList).toBeUndefined()
      })

      test("Should handle formatDate error and return unformatted date", async () => {
        const mockedStore = {
          bills: jest.fn(() => ({
            list: () => Promise.resolve([
              {
                id: "test",
                date: "invalid-date-format",
                status: "pending",
                type: "Test",
                name: "Test Bill",
              }
            ])
          }))
        }
        const billsContainer = new Bills({
          document,
          onNavigate: jest.fn(),
          store: mockedStore,
          localStorage: window.localStorage,
        })
        const billsList = await billsContainer.getBills()
        expect(billsList[0].date).toBe("invalid-date-format")
        expect(billsList[0].status).toBeDefined()
      })

      test("Should filter and format all bills correctly", async () => {
        const billsContainer = new Bills({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
        })
        const billsList = await billsContainer.getBills()
        billsList.forEach(bill => {
          expect(bill).toHaveProperty("id")
          expect(bill).toHaveProperty("date")
          expect(bill).toHaveProperty("status")
          expect(bill).toHaveProperty("name")
          expect(bill).toHaveProperty("type")
        })
      })
    })
  })
})
