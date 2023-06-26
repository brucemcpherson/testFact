function testFact() {
  // initialize library with apps script depdendencies
  Exports.Deps.init({
    fetch: UrlFetchApp.fetch
  })

  // get the apiKey
  const apiKey = PropertiesService.getScriptProperties().getProperty("apiKey")

  const fact = Exports.newFact({
    apiKey
  })


  const r =  fact.search({ noisy: true, query: "the earth is flat" })
  console.log(r.data)

}



const sheetFact = () => {

  // initialize library with apps script depdendencies
  Exports.Deps.init({
    fetch: UrlFetchApp.fetch
  })
  // get the apiKey
  const apiKey = PropertiesService.getScriptProperties().getProperty("apiKey")

  // default api options for all apis for this run
  const apiOptions = {
    noisy: true,
    throwOnError: true,
    noCache: false
  }

  const fact = Exports.newFact({
    apiKey
  })

  const fiddler = Exports.newPreFiddler({
    id: "1ZHMCtybDWF4eO-7XUuaGLZDh0OUAiJvYA27Qc5UaSMQ",
    sheetName: "claims"
  })



  // process each claim
  const validateClaims = (queries) => {

    return queries.reduce((p, query) => {

      // fact check each row
    const { data } = fact.search({ ...apiOptions, query, limit: 5 })

      // register results
      if (!data || !data.claims || !data.claims.length) {
        p.push({
          query,
          text: "no fact check data found"
        })

      } else {
        // unpack each claim
        data.claims.forEach(claim => {
          // separate the claim review object from the other properties
          let { rest, claimReview } =
            [claim].map(({ claimReview, ...rest }) => ({ rest, claimReview }))[0]
          if (!claimReview || !claimReview.length) {
            // possible there are fact checkswith no reviews
            p.push({
              query,
              ...rest
            })

          } else {
            // a set of reviews
            claimReview.forEach(review => {
              // seperate out the publisher object
              const { publisher, substance } =
                [review].map(({ publisher, ...substance }) => ({ publisher, substance }))[0]
              p.push({
                query,
                ...rest,
                ...substance,
                ...publisher
              })
            })
          }
        })
      }
      return p
    }, [])
  }


  // get all the claims from sheet  - (drop data from previous runs and dedup)
  const queries = Array.from(new Set(fiddler.getData().map(f => f.query))).filter(f => f)

  // do the work and dump to sheet
  fiddler.setData(validateClaims(queries))
    .dumpValues()


}


