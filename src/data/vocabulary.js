/**
 * English Journey – Vocabulary Database
 * Structure designed for thousands of words later.
 * Levels: A1, A2, B1, B2, C1
 */

const vocabulary = [
  // A1
  { id: "w001", word: "hello", meaning_fa: "سلام", meaning_en: "a greeting", pronunciation: "/həˈloʊ/", example: "Hello, how are you?", example_fa: "سلام، حال شما چطور است؟", level: "A1", partOfSpeech: "interjection", category: "greetings" },
  { id: "w002", word: "goodbye", meaning_fa: "خداحافظ", meaning_en: "a farewell", pronunciation: "/ɡʊdˈbaɪ/", example: "Goodbye, see you tomorrow.", example_fa: "خداحافظ، فردا می‌بینمت.", level: "A1", partOfSpeech: "interjection", category: "greetings" },
  { id: "w003", word: "thank you", meaning_fa: "متشکرم", meaning_en: "expression of gratitude", pronunciation: "/θæŋk juː/", example: "Thank you for your help.", example_fa: "از کمکت متشکرم.", level: "A1", partOfSpeech: "phrase", category: "greetings" },
  { id: "w004", word: "please", meaning_fa: "لطفاً", meaning_en: "polite request", pronunciation: "/pliːz/", example: "Please sit down.", example_fa: "لطفاً بنشینید.", level: "A1", partOfSpeech: "adverb", category: "greetings" },
  { id: "w005", word: "yes", meaning_fa: "بله", meaning_en: "affirmative", pronunciation: "/jes/", example: "Yes, I agree.", example_fa: "بله، موافقم.", level: "A1", partOfSpeech: "adverb", category: "basic" },
  { id: "w006", word: "no", meaning_fa: "خیر", meaning_en: "negative", pronunciation: "/noʊ/", example: "No, I don't want it.", example_fa: "نه، نمی‌خواهمش.", level: "A1", partOfSpeech: "adverb", category: "basic" },
  { id: "w007", word: "water", meaning_fa: "آب", meaning_en: "H2O liquid", pronunciation: "/ˈwɔːtər/", example: "I need a glass of water.", example_fa: "به یک لیوان آب نیاز دارم.", level: "A1", partOfSpeech: "noun", category: "food" },
  { id: "w008", word: "food", meaning_fa: "غذا", meaning_en: "something to eat", pronunciation: "/fuːd/", example: "The food is delicious.", example_fa: "غذا خوشمزه است.", level: "A1", partOfSpeech: "noun", category: "food" },
  { id: "w009", word: "book", meaning_fa: "کتاب", meaning_en: "written work", pronunciation: "/bʊk/", example: "I am reading a book.", example_fa: "دارم یک کتاب می‌خوانم.", level: "A1", partOfSpeech: "noun", category: "education" },
  { id: "w010", word: "friend", meaning_fa: "دوست", meaning_en: "a person you like", pronunciation: "/frend/", example: "She is my best friend.", example_fa: "او بهترین دوست من است.", level: "A1", partOfSpeech: "noun", category: "people" },

  // A2
  { id: "w011", word: "abandon", meaning_fa: "رها کردن", meaning_en: "to leave forever", pronunciation: "/əˈbændən/", example: "He abandoned his car.", example_fa: "او ماشینش را رها کرد.", level: "A2", partOfSpeech: "verb", category: "actions" },
  { id: "w012", word: "achieve", meaning_fa: "به دست آوردن / موفق شدن", meaning_en: "to successfully reach a goal", pronunciation: "/əˈtʃiːv/", example: "She achieved her goal.", example_fa: "او به هدفش رسید.", level: "A2", partOfSpeech: "verb", category: "success" },
  { id: "w013", word: "challenge", meaning_fa: "چالش", meaning_en: "a difficult task", pronunciation: "/ˈtʃælɪndʒ/", example: "Learning a language is a challenge.", example_fa: "یادگیری زبان یک چالش است.", level: "A2", partOfSpeech: "noun", category: "general" },
  { id: "w014", word: "improve", meaning_fa: "بهبود دادن", meaning_en: "to make better", pronunciation: "/ɪmˈpruːv/", example: "I want to improve my English.", example_fa: "می‌خواهم انگلیسی‌ام را بهتر کنم.", level: "A2", partOfSpeech: "verb", category: "learning" },
  { id: "w015", word: "decide", meaning_fa: "تصمیم گرفتن", meaning_en: "to make a choice", pronunciation: "/dɪˈsaɪd/", example: "I decided to study harder.", example_fa: "تصمیم گرفتم سخت‌تر درس بخوانم.", level: "A2", partOfSpeech: "verb", category: "thinking" },
  { id: "w016", word: "travel", meaning_fa: "سفر کردن", meaning_en: "to go from one place to another", pronunciation: "/ˈtrævəl/", example: "I love to travel alone.", example_fa: "عاشق تنها سفر کردن هستم.", level: "A2", partOfSpeech: "verb", category: "travel" },
  { id: "w017", word: "weather", meaning_fa: "آب و هوا", meaning_en: "conditions of the atmosphere", pronunciation: "/ˈweðər/", example: "The weather is nice today.", example_fa: "امروز هوا خوب است.", level: "A2", partOfSpeech: "noun", category: "nature" },
  { id: "w018", word: "remember", meaning_fa: "به خاطر آوردن", meaning_en: "to keep in mind", pronunciation: "/rɪˈmembər/", example: "Do you remember my name?", example_fa: "اسم من را به خاطر می‌آوری؟", level: "A2", partOfSpeech: "verb", category: "thinking" },
  { id: "w019", word: "forget", meaning_fa: "فراموش کردن", meaning_en: "to fail to remember", pronunciation: "/fərˈɡet/", example: "Don't forget your keys.", example_fa: "کلیدهایت را فراموش نکن.", level: "A2", partOfSpeech: "verb", category: "thinking" },
  { id: "w020", word: "practice", meaning_fa: "تمرین کردن", meaning_en: "to do something repeatedly", pronunciation: "/ˈpræktɪs/", example: "Practice makes perfect.", example_fa: "تمرین باعث کمال می‌شود.", level: "A2", partOfSpeech: "verb", category: "learning" },

  // B1
  { id: "w021", word: "accurate", meaning_fa: "دقیق", meaning_en: "correct and exact", pronunciation: "/ˈækjərət/", example: "The information is accurate.", example_fa: "اطلاعات دقیق است.", level: "B1", partOfSpeech: "adjective", category: "quality" },
  { id: "w022", word: "benefit", meaning_fa: "فایده / سود", meaning_en: "an advantage", pronunciation: "/ˈbenɪfɪt/", example: "Exercise has many benefits.", example_fa: "ورزش فواید زیادی دارد.", level: "B1", partOfSpeech: "noun", category: "general" },
  { id: "w023", word: "confident", meaning_fa: "با اعتمادبه‌نفس", meaning_en: "feeling sure about yourself", pronunciation: "/ˈkɑːnfɪdənt/", example: "He feels confident now.", example_fa: "او اکنون اعتمادبه‌نفس دارد.", level: "B1", partOfSpeech: "adjective", category: "emotions" },
  { id: "w024", word: "require", meaning_fa: "نیاز داشتن / مستلزم بودن", meaning_en: "to need something", pronunciation: "/rɪˈkwaɪər/", example: "This job requires experience.", example_fa: "این شغل به تجربه نیاز دارد.", level: "B1", partOfSpeech: "verb", category: "work" },
  { id: "w025", word: "opportunity", meaning_fa: "فرصت", meaning_en: "a chance to do something", pronunciation: "/ˌɑːpərˈtuːnəti/", example: "This is a great opportunity.", example_fa: "این یک فرصت عالی است.", level: "B1", partOfSpeech: "noun", category: "success" },
  { id: "w026", word: "experience", meaning_fa: "تجربه", meaning_en: "knowledge from doing something", pronunciation: "/ɪkˈspɪriəns/", example: "She has a lot of experience.", example_fa: "او تجربه زیادی دارد.", level: "B1", partOfSpeech: "noun", category: "work" },
  { id: "w027", word: "suggest", meaning_fa: "پیشنهاد دادن", meaning_en: "to put forward an idea", pronunciation: "/səˈdʒest/", example: "I suggest we leave early.", example_fa: "پیشنهاد می‌کنم زودتر برویم.", level: "B1", partOfSpeech: "verb", category: "communication" },
  { id: "w028", word: "consider", meaning_fa: "در نظر گرفتن", meaning_en: "to think carefully about", pronunciation: "/kənˈsɪdər/", example: "Please consider my offer.", example_fa: "لطفاً پیشنهاد مرا در نظر بگیرید.", level: "B1", partOfSpeech: "verb", category: "thinking" },
  { id: "w029", word: "develop", meaning_fa: "توسعه دادن", meaning_en: "to grow or improve", pronunciation: "/dɪˈveləp/", example: "We need to develop new skills.", example_fa: "باید مهارت‌های جدیدی توسعه دهیم.", level: "B1", partOfSpeech: "verb", category: "growth" },
  { id: "w030", word: "environment", meaning_fa: "محیط زیست / محیط", meaning_en: "the natural world or surroundings", pronunciation: "/ɪnˈvaɪrənmənt/", example: "We must protect the environment.", example_fa: "باید از محیط زیست محافظت کنیم.", level: "B1", partOfSpeech: "noun", category: "nature" },

  // more B1-B2
  { id: "w031", word: "achieve", meaning_fa: "دست یافتن", meaning_en: "to successfully complete", pronunciation: "/əˈtʃiːv/", example: "He achieved great success.", example_fa: "او به موفقیت بزرگی دست یافت.", level: "B1", partOfSpeech: "verb", category: "success" },
  { id: "w032", word: "affect", meaning_fa: "تأثیر گذاشتن", meaning_en: "to have an influence on", pronunciation: "/əˈfekt/", example: "The news affected everyone.", example_fa: "خبر روی همه تأثیر گذاشت.", level: "B1", partOfSpeech: "verb", category: "general" },
  { id: "w033", word: "analyze", meaning_fa: "تحلیل کردن", meaning_en: "to examine carefully", pronunciation: "/ˈænəlaɪz/", example: "We need to analyze the data.", example_fa: "باید داده‌ها را تحلیل کنیم.", level: "B2", partOfSpeech: "verb", category: "thinking" },
  { id: "w034", word: "approach", meaning_fa: "رویکرد / نزدیک شدن", meaning_en: "a way of dealing with something", pronunciation: "/əˈproʊtʃ/", example: "We need a new approach.", example_fa: "به یک رویکرد جدید نیاز داریم.", level: "B2", partOfSpeech: "noun", category: "thinking" },
  { id: "w035", word: "assume", meaning_fa: "فرض کردن", meaning_en: "to accept as true without proof", pronunciation: "/əˈsuːm/", example: "I assume you are ready.", example_fa: "فرض می‌کنم آماده‌ای.", level: "B2", partOfSpeech: "verb", category: "thinking" },
  { id: "w036", word: "available", meaning_fa: "در دسترس", meaning_en: "able to be used or obtained", pronunciation: "/əˈveɪləbəl/", example: "The book is available online.", example_fa: "کتاب به صورت آنلاین در دسترس است.", level: "B1", partOfSpeech: "adjective", category: "general" },
  { id: "w037", word: "aware", meaning_fa: "آگاه", meaning_en: "knowing about something", pronunciation: "/əˈwer/", example: "She is aware of the problem.", example_fa: "او از مشکل آگاه است.", level: "B1", partOfSpeech: "adjective", category: "thinking" },
  { id: "w038", word: "benefit", meaning_fa: "سود بردن", meaning_en: "to receive an advantage", pronunciation: "/ˈbenɪfɪt/", example: "You will benefit from this course.", example_fa: "از این دوره سود خواهی برد.", level: "B1", partOfSpeech: "verb", category: "learning" },
  { id: "w039", word: "capable", meaning_fa: "قادر / توانا", meaning_en: "having the ability", pronunciation: "/ˈkeɪpəbəl/", example: "She is capable of great things.", example_fa: "او قادر به کارهای بزرگ است.", level: "B2", partOfSpeech: "adjective", category: "quality" },
  { id: "w040", word: "complex", meaning_fa: "پیچیده", meaning_en: "consisting of many parts", pronunciation: "/kəmˈpleks/", example: "This is a complex issue.", example_fa: "این یک مسئله پیچیده است.", level: "B2", partOfSpeech: "adjective", category: "quality" },

  // C1 / more advanced
  { id: "w041", word: "comprehensive", meaning_fa: "جامع", meaning_en: "complete and including everything", pronunciation: "/ˌkɑːmprɪˈhensɪv/", example: "We need a comprehensive plan.", example_fa: "به یک برنامه جامع نیاز داریم.", level: "C1", partOfSpeech: "adjective", category: "quality" },
  { id: "w042", word: "consequence", meaning_fa: "پیامد", meaning_en: "a result of an action", pronunciation: "/ˈkɑːnsɪkwens/", example: "Every action has consequences.", example_fa: "هر عملی پیامدهایی دارد.", level: "B2", partOfSpeech: "noun", category: "general" },
  { id: "w043", word: "consistent", meaning_fa: "سازگار / مداوم", meaning_en: "always behaving the same way", pronunciation: "/kənˈsɪstənt/", example: "Be consistent in your practice.", example_fa: "در تمرین‌هایت مداوم باش.", level: "B2", partOfSpeech: "adjective", category: "quality" },
  { id: "w044", word: "contribute", meaning_fa: "مشارکت کردن", meaning_en: "to give or add something", pronunciation: "/kənˈtrɪbjuːt/", example: "Everyone should contribute.", example_fa: "همه باید مشارکت کنند.", level: "B2", partOfSpeech: "verb", category: "social" },
  { id: "w045", word: "crucial", meaning_fa: "حیاتی / بسیار مهم", meaning_en: "extremely important", pronunciation: "/ˈkruːʃəl/", example: "Timing is crucial.", example_fa: "زمان‌بندی حیاتی است.", level: "B2", partOfSpeech: "adjective", category: "quality" },
  { id: "w046", word: "demonstrate", meaning_fa: "نشان دادن / اثبات کردن", meaning_en: "to show clearly", pronunciation: "/ˈdemənstreɪt/", example: "He demonstrated his skills.", example_fa: "او مهارت‌هایش را نشان داد.", level: "B2", partOfSpeech: "verb", category: "communication" },
  { id: "w047", word: "determine", meaning_fa: "تعیین کردن / مشخص کردن", meaning_en: "to decide or find out", pronunciation: "/dɪˈtɜːrmɪn/", example: "We need to determine the cause.", example_fa: "باید علت را مشخص کنیم.", level: "B2", partOfSpeech: "verb", category: "thinking" },
  { id: "w048", word: "efficient", meaning_fa: "کارآمد", meaning_en: "working well without waste", pronunciation: "/ɪˈfɪʃənt/", example: "This method is more efficient.", example_fa: "این روش کارآمدتر است.", level: "B2", partOfSpeech: "adjective", category: "quality" },
  { id: "w049", word: "establish", meaning_fa: "ایجاد کردن / برقرار کردن", meaning_en: "to set up or create", pronunciation: "/ɪˈstæblɪʃ/", example: "They established a new company.", example_fa: "آن‌ها یک شرکت جدید ایجاد کردند.", level: "B2", partOfSpeech: "verb", category: "business" },
  { id: "w050", word: "evaluate", meaning_fa: "ارزیابی کردن", meaning_en: "to judge the value or quality", pronunciation: "/ɪˈvæljuːeɪt/", example: "We will evaluate your progress.", example_fa: "پیشرفت شما را ارزیابی خواهیم کرد.", level: "B2", partOfSpeech: "verb", category: "learning" },

  // Additional useful words to reach ~100
  { id: "w051", word: "expand", meaning_fa: "گسترش دادن", meaning_en: "to make larger", pronunciation: "/ɪkˈspænd/", example: "We want to expand the business.", example_fa: "می‌خواهیم کسب‌وکار را گسترش دهیم.", level: "B1", partOfSpeech: "verb", category: "growth" },
  { id: "w052", word: "focus", meaning_fa: "تمرکز کردن", meaning_en: "to concentrate attention", pronunciation: "/ˈfoʊkəs/", example: "Focus on your goals.", example_fa: "روی اهدافت تمرکز کن.", level: "B1", partOfSpeech: "verb", category: "thinking" },
  { id: "w053", word: "generate", meaning_fa: "تولید کردن", meaning_en: "to produce or create", pronunciation: "/ˈdʒenəreɪt/", example: "Solar panels generate electricity.", example_fa: "پنل‌های خورشیدی برق تولید می‌کنند.", level: "B2", partOfSpeech: "verb", category: "science" },
  { id: "w054", word: "identify", meaning_fa: "شناسایی کردن", meaning_en: "to recognize or name", pronunciation: "/aɪˈdentɪfaɪ/", example: "Can you identify the problem?", example_fa: "می‌توانی مشکل را شناسایی کنی؟", level: "B1", partOfSpeech: "verb", category: "thinking" },
  { id: "w055", word: "impact", meaning_fa: "تأثیر", meaning_en: "a strong effect", pronunciation: "/ˈɪmpækt/", example: "The impact was huge.", example_fa: "تأثیر آن بسیار زیاد بود.", level: "B2", partOfSpeech: "noun", category: "general" },
  { id: "w056", word: "indicate", meaning_fa: "نشان دادن", meaning_en: "to point out or show", pronunciation: "/ˈɪndɪkeɪt/", example: "The results indicate success.", example_fa: "نتایج نشان‌دهنده موفقیت است.", level: "B2", partOfSpeech: "verb", category: "communication" },
  { id: "w057", word: "maintain", meaning_fa: "حفظ کردن / نگه داشتن", meaning_en: "to keep in good condition", pronunciation: "/meɪnˈteɪn/", example: "It's hard to maintain motivation.", example_fa: "حفظ انگیزه سخت است.", level: "B2", partOfSpeech: "verb", category: "general" },
  { id: "w058", word: "obtain", meaning_fa: "به دست آوردن", meaning_en: "to get something", pronunciation: "/əbˈteɪn/", example: "How did you obtain this information?", example_fa: "چطور این اطلاعات را به دست آوردی؟", level: "B2", partOfSpeech: "verb", category: "general" },
  { id: "w059", word: "occur", meaning_fa: "رخ دادن", meaning_en: "to happen", pronunciation: "/əˈkɜːr/", example: "Accidents can occur anytime.", example_fa: "حوادث ممکن است هر زمان رخ دهند.", level: "B1", partOfSpeech: "verb", category: "general" },
  { id: "w060", word: "participate", meaning_fa: "شرکت کردن", meaning_en: "to take part in", pronunciation: "/pɑːrˈtɪsɪpeɪt/", example: "Everyone should participate.", example_fa: "همه باید شرکت کنند.", level: "B1", partOfSpeech: "verb", category: "social" },

  { id: "w061", word: "perceive", meaning_fa: "درک کردن / تلقی کردن", meaning_en: "to become aware of", pronunciation: "/pərˈsiːv/", example: "How do you perceive this situation?", example_fa: "این موقعیت را چطور درک می‌کنی؟", level: "C1", partOfSpeech: "verb", category: "thinking" },
  { id: "w062", word: "potential", meaning_fa: "پتانسیل / بالقوه", meaning_en: "possible ability or power", pronunciation: "/pəˈtenʃəl/", example: "She has great potential.", example_fa: "او پتانسیل بالایی دارد.", level: "B2", partOfSpeech: "noun", category: "quality" },
  { id: "w063", word: "previous", meaning_fa: "قبلی", meaning_en: "existing or happening before", pronunciation: "/ˈpriːviəs/", example: "I worked there in a previous job.", example_fa: "در شغل قبلی آنجا کار می‌کردم.", level: "B1", partOfSpeech: "adjective", category: "time" },
  { id: "w064", word: "primary", meaning_fa: "اصلی / اولیه", meaning_en: "most important", pronunciation: "/ˈpraɪmeri/", example: "Education is a primary concern.", example_fa: "آموزش یک دغدغه اصلی است.", level: "B2", partOfSpeech: "adjective", category: "quality" },
  { id: "w065", word: "process", meaning_fa: "فرآیند", meaning_en: "a series of actions", pronunciation: "/ˈprɑːses/", example: "Learning is a continuous process.", example_fa: "یادگیری یک فرآیند مداوم است.", level: "B1", partOfSpeech: "noun", category: "learning" },
  { id: "w066", word: "pursue", meaning_fa: "دنبال کردن", meaning_en: "to follow or chase", pronunciation: "/pərˈsuː/", example: "She decided to pursue her dreams.", example_fa: "او تصمیم گرفت رویاهایش را دنبال کند.", level: "B2", partOfSpeech: "verb", category: "goals" },
  { id: "w067", word: "range", meaning_fa: "محدوده / دامنه", meaning_en: "the area between limits", pronunciation: "/reɪndʒ/", example: "The price range is wide.", example_fa: "محدوده قیمت گسترده است.", level: "B1", partOfSpeech: "noun", category: "general" },
  { id: "w068", word: "relevant", meaning_fa: "مرتبط", meaning_en: "closely connected", pronunciation: "/ˈreləvənt/", example: "Is this information relevant?", example_fa: "این اطلاعات مرتبط است؟", level: "B2", partOfSpeech: "adjective", category: "quality" },
  { id: "w069", word: "significant", meaning_fa: "قابل توجه / مهم", meaning_en: "important or large enough", pronunciation: "/sɪɡˈnɪfɪkənt/", example: "There was a significant change.", example_fa: "تغییر قابل توجهی رخ داد.", level: "B2", partOfSpeech: "adjective", category: "quality" },
  { id: "w070", word: "source", meaning_fa: "منبع", meaning_en: "the origin of something", pronunciation: "/sɔːrs/", example: "What is the source of this data?", example_fa: "منبع این داده چیست؟", level: "B1", partOfSpeech: "noun", category: "general" },

  { id: "w071", word: "specific", meaning_fa: "خاص / مشخص", meaning_en: "clearly defined", pronunciation: "/spəˈsɪfɪk/", example: "I need specific details.", example_fa: "به جزئیات مشخص نیاز دارم.", level: "B1", partOfSpeech: "adjective", category: "quality" },
  { id: "w072", word: "strategy", meaning_fa: "استراتژی / راهبرد", meaning_en: "a plan of action", pronunciation: "/ˈstrætədʒi/", example: "We need a better strategy.", example_fa: "به استراتژی بهتری نیاز داریم.", level: "B2", partOfSpeech: "noun", category: "thinking" },
  { id: "w073", word: "structure", meaning_fa: "ساختار", meaning_en: "the way something is organized", pronunciation: "/ˈstrʌktʃər/", example: "The structure of the sentence is correct.", example_fa: "ساختار جمله درست است.", level: "B1", partOfSpeech: "noun", category: "language" },
  { id: "w074", word: "sufficient", meaning_fa: "کافی", meaning_en: "enough", pronunciation: "/səˈfɪʃənt/", example: "We have sufficient time.", example_fa: "زمان کافی داریم.", level: "B2", partOfSpeech: "adjective", category: "quantity" },
  { id: "w075", word: "support", meaning_fa: "حمایت کردن", meaning_en: "to help or encourage", pronunciation: "/səˈpɔːrt/", example: "I support your decision.", example_fa: "از تصمیم تو حمایت می‌کنم.", level: "B1", partOfSpeech: "verb", category: "social" },
  { id: "w076", word: "theory", meaning_fa: "نظریه", meaning_en: "an idea that explains something", pronunciation: "/ˈθɪəri/", example: "This is just a theory.", example_fa: "این فقط یک نظریه است.", level: "B2", partOfSpeech: "noun", category: "science" },
  { id: "w077", word: "tradition", meaning_fa: "سنت", meaning_en: "a long-established custom", pronunciation: "/trəˈdɪʃən/", example: "This is an old tradition.", example_fa: "این یک سنت قدیمی است.", level: "B1", partOfSpeech: "noun", category: "culture" },
  { id: "w078", word: "transform", meaning_fa: "دگرگون کردن", meaning_en: "to change completely", pronunciation: "/trænsˈfɔːrm/", example: "Technology transformed our lives.", example_fa: "فناوری زندگی ما را دگرگون کرد.", level: "B2", partOfSpeech: "verb", category: "change" },
  { id: "w079", word: "unique", meaning_fa: "منحصر به فرد", meaning_en: "being the only one of its kind", pronunciation: "/juːˈniːk/", example: "Everyone is unique.", example_fa: "هر کسی منحصر به فرد است.", level: "B1", partOfSpeech: "adjective", category: "quality" },
  { id: "w080", word: "vary", meaning_fa: "متفاوت بودن / تغییر کردن", meaning_en: "to be different", pronunciation: "/ˈveri/", example: "Prices vary by location.", example_fa: "قیمت‌ها بر اساس مکان متفاوت است.", level: "B1", partOfSpeech: "verb", category: "general" },

  { id: "w081", word: "vision", meaning_fa: "چشم‌انداز / بینش", meaning_en: "the ability to think about the future", pronunciation: "/ˈvɪʒən/", example: "She has a clear vision.", example_fa: "او چشم‌انداز واضحی دارد.", level: "B2", partOfSpeech: "noun", category: "thinking" },
  { id: "w082", word: "volume", meaning_fa: "حجم", meaning_en: "the amount of space", pronunciation: "/ˈvɑːljuːm/", example: "Turn down the volume.", example_fa: "صدا را کم کن.", level: "B1", partOfSpeech: "noun", category: "general" },
  { id: "w083", word: "widespread", meaning_fa: "گسترده", meaning_en: "existing over a large area", pronunciation: "/ˈwaɪdspred/", example: "The problem is widespread.", example_fa: "مشکل گسترده است.", level: "B2", partOfSpeech: "adjective", category: "quality" },
  { id: "w084", word: "abandon", meaning_fa: "ترک کردن", meaning_en: "to give up completely", pronunciation: "/əˈbændən/", example: "Don't abandon your dreams.", example_fa: "رویاهایت را ترک نکن.", level: "A2", partOfSpeech: "verb", category: "emotions" },
  { id: "w085", word: "adapt", meaning_fa: "سازگار شدن", meaning_en: "to change to fit a new situation", pronunciation: "/əˈdæpt/", example: "We must adapt to change.", example_fa: "باید با تغییر سازگار شویم.", level: "B1", partOfSpeech: "verb", category: "change" },
  { id: "w086", word: "ambition", meaning_fa: "جاه‌طلبی / آرزو", meaning_en: "a strong desire to succeed", pronunciation: "/æmˈbɪʃən/", example: "He has great ambition.", example_fa: "او جاه‌طلبی بالایی دارد.", level: "B2", partOfSpeech: "noun", category: "emotions" },
  { id: "w087", word: "appreciate", meaning_fa: "قدردانی کردن", meaning_en: "to recognize the value of", pronunciation: "/əˈpriːʃieɪt/", example: "I appreciate your help.", example_fa: "از کمکت قدردانی می‌کنم.", level: "B1", partOfSpeech: "verb", category: "emotions" },
  { id: "w088", word: "attitude", meaning_fa: "نگرش", meaning_en: "a way of thinking or feeling", pronunciation: "/ˈætɪtuːd/", example: "A positive attitude helps.", example_fa: "نگرش مثبت کمک می‌کند.", level: "B1", partOfSpeech: "noun", category: "emotions" },
  { id: "w089", word: "awareness", meaning_fa: "آگاهی", meaning_en: "knowledge or perception", pronunciation: "/əˈwernəs/", example: "Raise awareness about the issue.", example_fa: "در مورد این موضوع آگاهی‌رسانی کن.", level: "B2", partOfSpeech: "noun", category: "thinking" },
  { id: "w090", word: "balance", meaning_fa: "تعادل", meaning_en: "a state of equal distribution", pronunciation: "/ˈbæləns/", example: "Work-life balance is important.", example_fa: "تعادل کار و زندگی مهم است.", level: "B1", partOfSpeech: "noun", category: "life" },

  { id: "w091", word: "capable", meaning_fa: "توانا", meaning_en: "having the necessary ability", pronunciation: "/ˈkeɪpəbəl/", example: "You are capable of more.", example_fa: "تو توانای بیشتری هستی.", level: "B1", partOfSpeech: "adjective", category: "quality" },
  { id: "w092", word: "commitment", meaning_fa: "تعهد", meaning_en: "the state of being dedicated", pronunciation: "/kəˈmɪtmənt/", example: "Show commitment to your goals.", example_fa: "نسبت به اهدافت تعهد نشان بده.", level: "B2", partOfSpeech: "noun", category: "character" },
  { id: "w093", word: "communicate", meaning_fa: "ارتباط برقرار کردن", meaning_en: "to share information", pronunciation: "/kəˈmjuːnɪkeɪt/", example: "We need to communicate better.", example_fa: "باید بهتر ارتباط برقرار کنیم.", level: "B1", partOfSpeech: "verb", category: "communication" },
  { id: "w094", word: "compete", meaning_fa: "رقابت کردن", meaning_en: "to try to win", pronunciation: "/kəmˈpiːt/", example: "They compete for the same job.", example_fa: "آن‌ها برای یک شغل رقابت می‌کنند.", level: "B1", partOfSpeech: "verb", category: "work" },
  { id: "w095", word: "concentrate", meaning_fa: "تمرکز کردن", meaning_en: "to focus attention", pronunciation: "/ˈkɑːnsəntreɪt/", example: "I can't concentrate right now.", example_fa: "الان نمی‌توانم تمرکز کنم.", level: "B1", partOfSpeech: "verb", category: "thinking" },
  { id: "w096", word: "confident", meaning_fa: "مطمئن", meaning_en: "feeling or showing certainty", pronunciation: "/ˈkɑːnfɪdənt/", example: "Stay confident during the interview.", example_fa: "در مصاحبه مطمئن بمان.", level: "B1", partOfSpeech: "adjective", category: "emotions" },
  { id: "w097", word: "consider", meaning_fa: "در نظر گرفتن", meaning_en: "to think about carefully", pronunciation: "/kənˈsɪdər/", example: "Consider all the options.", example_fa: "همه گزینه‌ها را در نظر بگیر.", level: "B1", partOfSpeech: "verb", category: "thinking" },
  { id: "w098", word: "create", meaning_fa: "خلق کردن", meaning_en: "to bring into existence", pronunciation: "/kriˈeɪt/", example: "Artists create beauty.", example_fa: "هنرمندان زیبایی خلق می‌کنند.", level: "A2", partOfSpeech: "verb", category: "creativity" },
  { id: "w099", word: "curious", meaning_fa: "کنجکاو", meaning_en: "eager to know", pronunciation: "/ˈkjʊriəs/", example: "Children are naturally curious.", example_fa: "کودکان به طور طبیعی کنجکاو هستند.", level: "B1", partOfSpeech: "adjective", category: "emotions" },
  { id: "w100", word: "determine", meaning_fa: "مصمم بودن", meaning_en: "to decide firmly", pronunciation: "/dɪˈtɜːrmɪn/", example: "She is determined to succeed.", example_fa: "او مصمم به موفقیت است.", level: "B2", partOfSpeech: "adjective", category: "character" }
];

// Remove potential duplicates by id (keep first)
const uniqueMap = new Map();
vocabulary.forEach(w => {
  if (!uniqueMap.has(w.id)) uniqueMap.set(w.id, w);
});

export const VOCABULARY = Array.from(uniqueMap.values());

export function getWordById(id) {
  return VOCABULARY.find(w => w.id === id) || null;
}

export function getWordsByLevel(level) {
  return VOCABULARY.filter(w => w.level === level);
}

export function getAllLevels() {
  return ["A1", "A2", "B1", "B2", "C1"];
}

export default VOCABULARY;
