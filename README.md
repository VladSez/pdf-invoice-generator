## Tools we use

- https://www.loglib.io/s/pdf-invoice-editor for analytics

## TODO

- [ ] Add OG images
- [ ] Test with big values/numbers on the invoice, e.g. 1 000 000 (check if pdf is displayed correctly)
- [ ] Add error handling and error pages/messages
- [ ] Create a name for the project
- [ ] TEST EVERYTHING on chrome, safari, firefox and maybe on mobile?? + introduce beta testers (colleagues, friends, family)
- Check https://x.com/levelsio/status/1860015822472905091

(Payments, not sure if we need this)

- [ ] Introduce payments via stripe? https://chatgpt.com/c/673db98b-a860-8007-8b53-1d7e0a9f40c1 or https://polar.sh/
- [ ] Force to log in to download invoice? (for log in we can use https://github.com/vvo/iron-session)

(BUGS and improvements, double check everything also if we need this)

- [ ] do not save those things (in page.tsx) in local storage, because they are not needed to be saved, we need them to be recalculated every time for better UX:

  const today = dayjs().format("YYYY-MM-DD");
  const lastDayOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");
  const invoiceCurrentMonthAndYear = dayjs().format("MM-YYYY");
  const paymentDue = dayjs(today).add(14, "days").format("YYYY-MM-DD");

  if data is in url, always use data from url
  if no data in url, use data from local storage
  if local storage data is last month, update it with today's data

(OTHER)

- [ ] cleanup code
- [ ] Move to SPA? vite or smth, because we have pure SPA
- [ ] Add more languages to pdf?
- [ ] Update to next 15???
- [ ] Use https://onedollarstats.com/analytics for analytics?
- [ ] Add changelog public and on github
