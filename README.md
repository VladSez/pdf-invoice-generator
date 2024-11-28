## TODO

- [] Add multiple items in invoice table and calculate total price and vat correctly, display pdf correctly
- [] BUG: type '15NP' or any Invalid input 'lol' in VAT input -> see error and can't clear input
- [] try to use 'update' from useFieldArray?

- [] Test with big values/numbers on the invoice, e.g. 1 000 000 (check if pdf is displayed correctly)
- [] Add error handling and error pages/messages
- [] Add link to github repo and make it open source
- [] Create a name for the project
- [] Add link to our prod website in the footer of pdf
- [] TEST EVERYTHING on chrome, safari, firefox and maybe on mobile?? + introduce beta testers (colleagues, friends, family)
- [] Deploy to Vercel
- [] Add email to contact us
- [] Update to next 15???
- Check https://x.com/levelsio/status/1860015822472905091

(Payments)

- [] Introduce payments via stripe? https://chatgpt.com/c/673db98b-a860-8007-8b53-1d7e0a9f40c1 or https://polar.sh/
- [] Force to log in to download invoice? (for log in we can use https://github.com/vvo/iron-session)

(BUGS and improvements, double check everything also if we need this)

- [] BindingError issue https://github.com/diegomura/react-pdf/issues/2892
- [] smth is wrong with bold styles after downgrading deps
- [] Add a button to create a shareable link to invoice. Fix current logic, because now we always put all invoice data in url.
- [] do not save those things (in page.tsx) in local storage, because they are not needed to be saved, we need them to be recalculated every time for better UX:

  const today = dayjs().format("YYYY-MM-DD");
  const lastDayOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");
  const invoiceCurrentMonthAndYear = dayjs().format("MM-YYYY");
  const paymentDue = dayjs(today).add(14, "days").format("YYYY-MM-DD");

(FONTS, check fonts here https://fontsource.org/)

- [] use https://next-international.vercel.app/docs for translations (i18n)?
- [] Add PL language and font that supports it, use https://www.npmjs.com/package/n2words or similar for numbers into words
- [] add new font to match afaktury.pl or at least supports polish language https://github.com/diegomura/react-pdf/issues/2675#issuecomment-2388723178 (FreeSans, FreeSansBold, Helvetica or just use Roboto https://fonts.google.com/?lang=pl_Latn&categoryFilters=Sans+Serif:%2FSans%2F*;Feeling:%2FExpressive%2FBusiness)

(OTHER)

- [] cleanup code
- [] Move to SPA? vite or smth, because we have pure SPA
- [] Add more languages?
