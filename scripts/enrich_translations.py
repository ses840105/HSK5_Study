#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enrich HSK5 & IELTS datasets with English and Chinese meanings and explanations.
"""
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HSK_DIR = os.path.join(BASE_DIR, "vocab")
IELTS_DIR = os.path.join(BASE_DIR, "ielts")

# 1. HSK Vocab En & Zh
hsk_vocab_translations = {
    "hv_01": {"en": "work part-time; part-time job", "zh": "兼职；打工", "trans_en": "Many college students use their vacations to do part-time jobs to accumulate social experience.", "trans_zh": "许多大学生利用假期做兼职积累社会经验。"},
    "hv_02": {"en": "concept, idea", "zh": "概念；观念", "trans_en": "The speaker clearly explained several core concepts in modern economics.", "trans_zh": "演讲者清晰地解释了现代经济学中的几个核心概念。"},
    "hv_03": {"en": "relieve, ease, mitigate", "zh": "缓解；缓和", "trans_en": "Doing moderate exercise helps relieve academic and work pressure.", "trans_zh": "适当运动有助于缓解学业和工作压力。"},
    "hv_04": {"en": "logic", "zh": "逻辑", "trans_en": "His debate statement was clear in logic and strongly convincing.", "trans_zh": "他在辩论中的陈述逻辑清晰，很有说服力。"},
    "hv_05": {"en": "hesitate", "zh": "犹豫；迟疑", "trans_en": "Faced with this rare opportunity, he did not hesitate to accept.", "trans_zh": "面对这个难得的机会，他毫不犹豫地接受了。"},
    "hv_06": {"en": "thorough; completely", "zh": "彻底；完全", "trans_en": "Before moving in, we cleaned the entire room thoroughly.", "trans_zh": "入住之前，我们把整个房间彻底打扫了一遍。"},
    "hv_07": {"en": "inspire, enlightenment", "zh": "启发；启示", "trans_en": "The professor's speech gave students profound inspiration.", "trans_zh": "教授的发言给同学们带来了深刻的启发。"},
    "hv_08": {"en": "principle", "zh": "原则", "trans_en": "No matter what happens, we must adhere to the principle of honesty.", "trans_zh": "无论发生什么，我们都要坚持诚信的原则。"},
    "hv_09": {"en": "delay, waste time", "zh": "耽误；延误", "trans_en": "Because of traffic jams, I was delayed by half an hour this morning.", "trans_zh": "因为路上堵车，今天早上我耽误了半小时。"},
    "hv_10": {"en": "overcome, conquer", "zh": "克服；战胜", "trans_en": "With teamwork and persistence, we finally overcame all technical difficulties.", "trans_zh": "通过团队合作和坚持，我们终于克服了所有技术困难。"},
    "hv_11": {"en": "efficiency", "zh": "效率", "trans_en": "Using suitable project tools can significantly improve study and work efficiency.", "trans_zh": "使用合适的工具可以显著提高学习和工作效率。"},
    "hv_12": {"en": "approve, agree with", "zh": "赞成；同意", "trans_en": "Most members in the meeting strongly approved of this reform proposal.", "trans_zh": "大多数参会人员非常赞成这项改革提议。"},
    "hv_13": {"en": "unique, distinctive", "zh": "独特；独一无二", "trans_en": "This museum has a very unique architectural style and design.", "trans_zh": "这座博物馆的建筑风格和设计非常独特。"},
    "hv_14": {"en": "trend, tendency", "zh": "趋势；走向", "trans_en": "Continuous digital transformation has become an inevitable trend worldwide.", "trans_zh": "数字化转型已成为全球不可避免的发展趋势。"},
    "hv_15": {"en": "prosperous, flourishing", "zh": "繁荣；繁华", "trans_en": "Trade and technological innovation brought economic prosperity to the coastal area.", "trans_zh": "贸易和技术创新促进了该沿海地区的经济繁荣。"},
    "hv_16": {"en": "cherish, treasure, value", "zh": "珍惜；珍爱", "trans_en": "We should cherish current study opportunities and time.", "trans_zh": "我们应当珍惜现在的学习机会和宝贵时间。"},
    "hv_17": {"en": "undertake, shoulder, assume", "zh": "承担；担负", "trans_en": "As the team leader, he took on the main responsibility of the project.", "trans_zh": "作为项目负责人，他主动承担了核心研发责任。"},
    "hv_18": {"en": "keen, sharp, acute", "zh": "敏锐；尖锐", "trans_en": "She possesses keen observation and easily detects market shifts.", "trans_zh": "她拥有敏锐的市场洞察力，能迅速察觉行业趋势。"},
    "hv_19": {"en": "challenge", "zh": "挑战", "trans_en": "Courageously facing new challenges promotes personal growth.", "trans_zh": "勇敢面对新的挑战能够促使我们快速成长。"},
    "hv_20": {"en": "proceed step by step, progress gradually", "zh": "循序渐进；按部就班", "trans_en": "Learning a new language requires step-by-step practice rather than rushing.", "trans_zh": "学习新语言需要循序渐进，不可急于求成。"},
    "hv_21": {"en": "grasp, master, confidence", "zh": "把握；掌握", "trans_en": "Through thorough preparation, he is confident of passing the HSK examination.", "trans_zh": "经过充分复习，他对通过考试很有把握。"},
    "hv_22": {"en": "contain, include, imply", "zh": "包含；涵盖", "trans_en": "This training plan contains comprehensive listening and reading exercises.", "trans_zh": "该培训方案包含全面的听力与阅读实战训练。"},
    "hv_23": {"en": "inevitable, necessary", "zh": "必然；必然性", "trans_en": "Failures and setbacks are inevitable on the road to success.", "trans_zh": "走向成功的道路上遇到挫折是必然的。"},
    "hv_24": {"en": "property, wealth, assets", "zh": "财产；财富", "trans_en": "Protecting citizens' lawful property is guaranteed by law.", "trans_zh": "法律严格保护公民的合法财产不受侵犯。"},
    "hv_25": {"en": "adopt, take (measures)", "zh": "采取；采纳", "trans_en": "The government adopted effective measures to curb environmental pollution.", "trans_zh": "政府采取了切实有效的措施来治理环境污染。"},
    "hv_26": {"en": "lead to, cause, result in", "zh": "导致；造成", "trans_en": "Careless verification led to errors in the final data sheet.", "trans_zh": "疏忽大意导致最终数据核算出现了差错。"},
    "hv_27": {"en": "implement, carry out thoroughly", "zh": "贯彻；落实", "trans_en": "The company firmly implemented the green environmental development strategy.", "trans_zh": "公司坚定贯彻绿色环保的发展战略。"},
    "hv_28": {"en": "hinder, obstruct, impede", "zh": "妨碍；阻碍", "trans_en": "Please do not make loud noises in the library so as not to disturb others.", "trans_zh": "在图书馆请保持安静，以免妨碍他人专注学习。"},
    "hv_29": {"en": "broad, extensive, widespread", "zh": "广泛；广博", "trans_en": "Artificial intelligence technology has gained widespread application across industries.", "trans_zh": "人工智能技术已在各行各业获得了极其广泛的应用。"},
    "hv_30": {"en": "core, nucleus, key", "zh": "核心；要害", "trans_en": "Mastering vocabulary and grammar rules is the core of passing the exam.", "trans_zh": "掌握核心词汇与语法结构是通过考试的关键。" }
}

# 2. HSK Chengyu En & Zh
hsk_chengyu_translations = {
    "hch_01": {"en": "draw inferences about other cases from one instance", "zh": "举一反三；触类旁通", "trans_en": "Studying should not merely absorb basic facts, but learn to deduce broader principles.", "trans_zh": "学习不仅要掌握基础知识，更要善于举一反三，触类旁通。"},
    "hch_02": {"en": "proceed step by step, gradual progress", "zh": "循序渐进；由浅入深", "trans_en": "Mastering advanced vocabulary requires gradual and steady accumulation.", "trans_zh": "掌握高阶词汇需要循序渐进地积累。"},
    "hch_03": {"en": "give up halfway, leave unfinished", "zh": "半途而废；前功尽弃", "trans_en": "Once you start, never give up halfway.", "trans_zh": "既然确定了目标，就决不能半途而废。"},
    "hch_04": {"en": "persevere unremittingly, tireless persistence", "zh": "坚持不懈；持之以恒", "trans_en": "With unremitting perseverance, he achieved remarkable success.", "trans_zh": "只要坚持不懈，就一定能取得显著成绩。"},
    "hch_05": {"en": "spare no effort, go all out", "zh": "全力以赴；竭尽全力", "trans_en": "We will go all out to achieve the highest score.", "trans_zh": "我们将全力以赴争取最好的成绩。"},
    "hch_06": {"en": "cross a river in the same boat; pull together through difficulty", "zh": "同舟共济；风雨同舟", "trans_en": "Faced with hardships, the team pulled together to overcome hurdles.", "trans_zh": "面对困境，团队全体成员同舟共济共渡难关。"},
    "hch_07": {"en": "learn from others' strengths to offset one's weaknesses", "zh": "取长补短；相互借鉴", "trans_en": "Collaborative study allows students to complement each other.", "trans_zh": "互相合作可以取长补短，共同进步。"},
    "hch_08": {"en": "express one's own opinions freely", "zh": "各抒己见；畅所欲言", "trans_en": "In the group discussion, everyone freely expressed their opinions.", "trans_zh": "研讨会上，大家各抒己见，气氛热烈。"},
    "hch_09": {"en": "act according to circumstances, adapt flexibly", "zh": "随机应变；灵活处理", "trans_en": "An experienced leader can adapt quickly when unforeseen situations arise.", "trans_zh": "面对突发情况，我们需要具备随机应变的能力。"},
    "hch_10": {"en": "in an endless stream, continuous flow", "zh": "络绎不绝；连绵不断", "trans_en": "Visitors came to the exhibition in an endless stream.", "trans_zh": "参观展览的游客整日络绎不绝。"},
    "hch_11": {"en": "suddenly see the light, suddenly realize", "zh": "恍然大悟；豁然开朗", "trans_en": "After hearing the teacher's explanation, I suddenly understood.", "trans_zh": "听完老师的详细讲解，我顿时恍然大悟。"},
    "hch_12": {"en": "hesitant, indecisive", "zh": "犹豫不决；瞻前顾后", "trans_en": "He remained indecisive between the two job offers.", "trans_zh": "在两个待遇优厚的录用机会前，他犹豫不决。"},
    "hch_13": {"en": "thought-provoking, meaningful and memorable", "zh": "耐人寻味；发人深省", "trans_en": "The ending of the novel was subtle and thought-provoking.", "trans_zh": "这部小说的结局耐人寻味，引人深思。"},
    "hch_14": {"en": "too impatient to wait, eager", "zh": "迫不及待；刻不容缓", "trans_en": "Upon opening the package, she could not wait to read the book.", "trans_zh": "收到包裹后，他迫不及待地打开阅读。"},
    "hch_15": {"en": "with keen pleasure, relish with gusto", "zh": "津津有味；兴致勃勃", "trans_en": "The children were reading the illustrated storybook with great relish.", "trans_zh": "孩子们津津有味地听着生动的故事。"},
    "hch_16": {"en": "matter of course, natural and reasonable", "zh": "理所当然；顺理成章", "trans_en": "Helping elderly and children on public transport is a matter of course.", "trans_zh": "在公交车上给老人让座是理所当然的事情。"},
    "hch_17": {"en": "baffling, without rhyme or reason", "zh": "莫名其妙；不可名状", "trans_en": "His sudden anger left everybody feeling baffled.", "trans_zh": "他突然发脾气让在场的人都觉得莫名其妙。"},
    "hch_18": {"en": "love something too much to part with it", "zh": "爱不释手；爱如珍宝", "trans_en": "This exquisitely crafted pen was so lovely that he could hardly put it down.", "trans_zh": "这本精装图册设计优雅，令人爱不释手。"},
    "hch_19": {"en": "known to every household, well known", "zh": "家喻户晓；妇孺皆知", "trans_en": "This folk tale is well known to every household in China.", "trans_zh": "这个励志故事在全国已经是家喻户晓。"},
    "hch_20": {"en": "unique, second to none", "zh": "独一无二；绝无仅有", "trans_en": "Every person's unique background shapes their individuality.", "trans_zh": "每个人独特的成长经历都是独一无二的。"},
    "hch_21": {"en": "seek truth from facts, be practical and realistic", "zh": "实事求是；求真务实", "trans_en": "Scientific research demands a rigorous, realistic attitude.", "trans_zh": "科学研究必须秉持实事求是的求实态度。"},
    "hch_22": {"en": "negligible, insignificant", "zh": "微不足道；不足挂齿", "trans_en": "Small contributions might seem negligible, but they add up to greatness.", "trans_zh": "点滴的善举虽然微不足道，汇聚起来却力量无穷。"},
    "hch_23": {"en": "by every possible means, leave no stone unturned", "zh": "千方百计；想方设法", "trans_en": "They tried by every possible means to rescue the trapped animals.", "trans_zh": "救援队千方百计营救受困人员。"},
    "hch_24": {"en": "inconceivable, unbelievable, incredible", "zh": "不可思议；难以置信", "trans_en": "The rapid advancement of quantum computing is truly incredible.", "trans_zh": "计算机技术的飞速发展简直令人不可思议。"},
    "hch_25": {"en": "clear at a glance, obvious", "zh": "一目了然；显而易见", "trans_en": "The graphical dashboard made all test metrics clear at a glance.", "trans_zh": "图表清晰直观，各项统计数据一目了然。"},
    "hch_26": {"en": "self-contradictory, paradox", "zh": "自相矛盾；漏洞百出", "trans_en": "His testimony was full of holes and self-contradictory.", "trans_zh": "他的发言前后抵触，显然自相矛盾。"},
    "hch_27": {"en": "send charcoal in snowy weather; timely help", "zh": "雪中送炭；患难相助", "trans_en": "Your prompt financial assistance was true help in times of need.", "trans_zh": "朋友在危急时刻的援助犹如雪中送炭。"},
    "hch_28": {"en": "add flowers to embroidery; make what is good even better", "zh": "锦上添花；好上加好", "trans_en": "Winning the national trophy on his graduation was icing on the cake.", "trans_zh": "获得全额奖学金为他的毕业成果锦上添花。"},
    "hch_29": {"en": "view the sky from the bottom of a well; narrow-minded", "zh": "坐井观天；目光短浅", "trans_en": "Do not judge the vast world from a narrow viewpoint like a frog in a well.", "trans_zh": "看待世界应当放宽视野，切勿坐井观天。"},
    "hch_30": {"en": "pull up seedlings to help them grow; spoil things by impatience", "zh": "拔苗助长；急功近利", "trans_en": "Excessive tutoring may backfire like pulling up seedlings to make them grow.", "trans_zh": "过度施压犹如拔苗助长，往往适得其反。" }
}

# 3. HSK Grammar En & Zh
hsk_grammar_translations = {
    "hg_01": {"category_en": "Ba-sentence (Disposal structure with complement)", "category_zh": "把字句（处置句动词完成补语）", "explanation_en": "In a Ba-sentence (把), the verb must have a complement (e.g. 修改一遍) or particle (了) and cannot stand alone. Negation (没, 不) must precede 把.", "explanation_zh": "把字句的动词不可单独出现，必须带补语或助词。否定词（没/不）必须置于‘把’字之前。"},
    "hg_02": {"category_en": "Bei-sentence (Passive voice negation placement)", "category_zh": "被字句（被动句否定词位置）", "explanation_en": "In a Bei-sentence (被), negative adverbs (没, 还没有) and modal verbs must be placed directly BEFORE '被'.", "explanation_zh": "被字句中，否定副词（没/不）或能愿动词必须位于被动标志‘被’的前面。"},
    "hg_03": {"category_en": "Existential sentence (Zunxianju location marker)", "category_zh": "存现句（处所词位于句首不用在）", "explanation_en": "In an existential sentence, the location noun phrase stands at the very beginning without the preposition '在'.", "explanation_zh": "存现句基本句型为处所词+动词+着/了+人/物，句首处所词前不加介词‘在’。"},
    "hg_04": {"category_en": "Pivotal sentence (Causative verbs 让/使/叫)", "category_zh": "兼语句（使役动词兼语结构）", "explanation_en": "In pivotal sentences with causative verbs (让, 使, 请), the object of the first verb serves as the subject of the second verb.", "explanation_zh": "使役兼语句中，前一动词的宾语同时兼任后一动词的主语。"},
    "hg_05": {"category_en": "Degree complement (Structural particle 得)", "category_zh": "程度补语（结构助词‘得’）", "explanation_en": "When describing degree or manner after a verb/adjective, use the structural particle '得' followed by the complement.", "explanation_zh": "动词或形容词后引出状态或程度评价时，使用结构助词‘得’。"},
    "hg_06": {"category_en": "Condition conjunction (Only if ... then: 只有...才...)", "category_zh": "条件复句（唯一条件：只有...才...）", "explanation_en": "'只有...才...' expresses a necessary/exclusive condition: only if A is met, will B occur.", "explanation_zh": "‘只有……才……’表示唯一必要条件，前后分句严格配对。"},
    "hg_07": {"category_en": "Comparative sentence (Inferior comparison: A 不如 B)", "category_zh": "比较句（否定推论：A不如B）", "explanation_en": "'A 不如 B + Adj' means A is not as good as B in that adjective quality.", "explanation_zh": "‘A不如B’表示A不及B，后可接形容词或动词短语。"},
    "hg_08": {"category_en": "Causal inversion (The reason why ... is because: 之所以...是因为...)", "category_zh": "因果倒装（之所以……是因为……）", "explanation_en": "Inverted causal pattern: state the result first with 之所以, then give the reason with 是因为.", "explanation_zh": "先指出结果（之所以），再阐述根本原因（是因为）。"},
    "hg_09": {"category_en": "Preference conjunction (Rather than A, better B: 与其...不如...)", "category_zh": "选择复句（取舍：与其……不如……）", "explanation_en": "Indicates abandoning choice A and preferring choice B ('Rather than A, better B').", "explanation_zh": "表示在两者权衡中放弃前者、选取后者。"},
    "hg_10": {"category_en": "Concession conjunction (Even if ... still: 哪怕...也...)", "category_zh": "让步假设（哪怕……也……）", "explanation_en": "'哪怕...也...' introduces an extreme hypothetical condition while affirming the conclusion remains valid.", "explanation_zh": "引入极端假设情况，但后句依然坚决施行。"},
    "hg_11": {"category_en": "Directional complement derivative meaning (起来 vs 下去)", "category_zh": "复合趋向补语引申义（起来与下去）", "explanation_en": "起来 implies starting and continuing, or assembling; 下去 implies continuing from past to future.", "explanation_zh": "‘起来’常表动作开始并持续或汇聚，‘下去’表动作向后继续发展。"},
    "hg_12": {"category_en": "Potential complement (Can/Cannot: 动词 + 得/不 + 补语)", "category_zh": "可能补语（听得懂 / 听不懂）", "explanation_en": "Insert '得' (affirmative) or '不' (negative) between the verb and result/direction complement.", "explanation_zh": "动词与结果/趋向补语之间插入‘得’或‘不’表示是否具备能力或可能性。"},
    "hg_13": {"category_en": "Preposition usage (About/Regarding: 关于 vs 对于)", "category_zh": "介词辨析（关于与对于）", "explanation_en": "'关于' introduces the general topic/scope; '对于' introduces the targeted recipient or attitude object.", "explanation_zh": "‘关于’指出关涉范围，多置于句首；‘对于’指出对待对象或态度。"},
    "hg_14": {"category_en": "Determined choice conjunction (Would rather ... than: 宁可...也...)", "category_zh": "决择复句（宁可……也……）", "explanation_en": "'宁可...也...' expresses strong willingness to accept hardship rather than compromise.", "explanation_zh": "表示两害相权取其轻，宁愿承受代价也要达成目的。"},
    "hg_15": {"category_en": "Serial verb construction (Manner / Purpose: 连动句)", "category_zh": "连动句（方式与目的）", "explanation_en": "In a serial verb sentence (S + V1 + O1 + V2 + O2), V1 often denotes method or purpose for V2.", "explanation_zh": "两个动词连续出现，第一动词常表第二动词的方式或手段。"},
    "hg_16": {"category_en": "HSK 5 Writing Part 1 Word Order (Verb Predicate)", "category_zh": "书写第一部分语序（动词谓语句）", "explanation_en": "Standard word order: Subject + Adverbial + Verb + Object.", "explanation_zh": "主谓宾基本语序：主语 + 状语 + 谓语动词 + 宾语。"},
    "hg_17": {"category_en": "HSK 5 Writing Part 1 Word Order (Ba-sentence destination)", "category_zh": "书写第一部分语序（把字句归着点）", "explanation_en": "Subject + 把 + Object + Verb + Complement (在/到/给/入).", "explanation_zh": "主语 + 把 + 处置对象 + 动词 + 补语（在/到/给）。"},
    "hg_18": {"category_en": "HSK 5 Writing Part 1 Word Order (Bei passive structure)", "category_zh": "书写第一部分语序（被动句式）", "explanation_en": "Patient subject + 被 + Agent + Verb + Other elements.", "explanation_zh": "受事主语 + 被 + 施事者 + 谓语动词 + 其他成分。"},
    "hg_19": {"category_en": "Multi-layer Attributive Order (多层定语)", "category_zh": "多层定语排序规则", "explanation_en": "Possessive / Demonstrative > Quantity > State adjective > Noun modifier.", "explanation_zh": "所属/指称 > 数量 > 描摹性形容词 > 属性名词。"},
    "hg_20": {"category_en": "Idiomatic Potential Complements (吃不消 / 经不起)", "category_zh": "可能补语常用习惯表达", "explanation_en": "Fixed expressions such as '吃不消' (cannot bear physically) and '经不起' (cannot withstand tests).", "explanation_zh": "如‘吃不消’（承受不了）、‘经不起’（无法经受考验）等固定结构。"},
    "hg_21": {"category_en": "Progressive conjunction (Not only ... but instead: 不仅没有...反而...)", "category_zh": "递进转折复句（不仅没……反而……）", "explanation_en": "Indicates an unexpected worsening or opposite outcome beyond the initial clause.", "explanation_zh": "表示情况没有按照常理发展，反而向相反或更深程度演进。"},
    "hg_22": {"category_en": "HSK 5 Writing Part 1 Word Order (Existential sentence)", "category_zh": "书写第一部分语序（存现句结构）", "explanation_en": "Place phrase + Verb + Zhe/Le + Indefinite Subject (Numeral-Measure + Noun).", "explanation_zh": "处所词 + 动词 + 着/了 + 不特定人或物（数量+名词）。"}
}

# 4. IELTS Vocab En & Zh
ielts_vocab_translations = {
    "iv_01": {"en": "affordable, reasonably priced", "zh": "经济实惠的；负担得起的", "trans_zh": "对于大学生来说，公共巴士和地铁的价格非常实惠。"},
    "iv_02": {"en": "convenient, easily accessible", "zh": "方便的；便利的", "trans_zh": "住在市中心非常便利，所有配套设施都在步行范围内。"},
    "iv_03": {"en": "reduce, lessen, diminish", "zh": "减少；降低", "trans_zh": "骑自行车上下班可以显著减少城市碳排放。"},
    "iv_04": {"en": "improve, enhance, upgrade", "zh": "改善；提高", "trans_zh": "持续阅读学术文章是提高雅思词汇量的极佳途径。"},
    "iv_05": {"en": "provide, supply, offer", "zh": "提供；供应", "trans_zh": "大学图书馆为所有注册学生提供丰富的在线学术资源。"},
    "iv_06": {"en": "develop, cultivate, foster", "zh": "发展；培养", "trans_zh": "鼓励独立思考有助于培养批判性分析能力。"},
    "iv_07": {"en": "schedule, timetable, agenda", "zh": "日程；时刻表", "trans_zh": "由于考试临近，她制定了严格的日常复习时间表。"},
    "iv_08": {"en": "local, regional, indigenous", "zh": "当地的；本地区的", "trans_zh": "游览当地农贸市场是体验本土文化与风俗的最佳方式。"},
    "iv_09": {"en": "protect, shield, defend", "zh": "保护；守护", "trans_zh": "国际社会必须通力合作，保护濒危野生动物栖息地。"},
    "iv_10": {"en": "essential, vital, crucial", "zh": "必不可少的；极其重要的", "trans_zh": "良好的时间管理对于高分通过雅思考试至关重要。"}
}

# Apply to HSK vocab
vocab_path = os.path.join(HSK_DIR, "hsk5_core_vocabulary.json")
with open(vocab_path, "r", encoding="utf-8") as f:
    hsk_vocab = json.load(f)

for item in hsk_vocab:
    iid = item["id"]
    if iid in hsk_vocab_translations:
        t = hsk_vocab_translations[iid]
        item["meaning_en"] = t["en"]
        item["meaning_zh"] = t["zh"]
        item["translation_en"] = t["trans_en"]
        item["translation_zh"] = t["trans_zh"]
    else:
        item["meaning_en"] = item["meaning"]
        item["meaning_zh"] = item["word"]
        item["translation_en"] = item["translation"]
        item["translation_zh"] = item["example"]

with open(vocab_path, "w", encoding="utf-8") as f:
    json.dump(hsk_vocab, f, ensure_ascii=False, indent=2)

print("HSK vocab enriched successfully.")

# Apply to HSK chengyu
chengyu_path = os.path.join(HSK_DIR, "hsk5_chengyu.json")
with open(chengyu_path, "r", encoding="utf-8") as f:
    hsk_chengyu = json.load(f)

for item in hsk_chengyu:
    iid = item["id"]
    if iid in hsk_chengyu_translations:
        t = hsk_chengyu_translations[iid]
        item["meaning_en"] = t["en"]
        item["meaning_zh"] = t["zh"]
        item["translation_en"] = t["trans_en"]
        item["translation_zh"] = t["trans_zh"]
    else:
        item["meaning_en"] = item["meaning"]
        item["meaning_zh"] = item["chengyu"]
        item["translation_en"] = item["translation"]
        item["translation_zh"] = item["example"]

with open(chengyu_path, "w", encoding="utf-8") as f:
    json.dump(hsk_chengyu, f, ensure_ascii=False, indent=2)

print("HSK chengyu enriched successfully.")

# Apply to HSK grammar
grammar_path = os.path.join(HSK_DIR, "hsk5_grammar.json")
with open(grammar_path, "r", encoding="utf-8") as f:
    hsk_grammar = json.load(f)

for item in hsk_grammar:
    iid = item["id"]
    if iid in hsk_grammar_translations:
        t = hsk_grammar_translations[iid]
        item["category_en"] = t["category_en"]
        item["category_zh"] = t["category_zh"]
        item["explanation_en"] = t["explanation_en"]
        item["explanation_zh"] = t["explanation_zh"]
    else:
        item["category_en"] = item["category"]
        item["category_zh"] = item["category"]
        item["explanation_en"] = item["explanation"]
        item["explanation_zh"] = item["explanation"]

with open(grammar_path, "w", encoding="utf-8") as f:
    json.dump(hsk_grammar, f, ensure_ascii=False, indent=2)

print("HSK grammar enriched successfully.")

# Apply to IELTS vocab
ivocab_path = os.path.join(IELTS_DIR, "ielts_vocab.json")
with open(ivocab_path, "r", encoding="utf-8") as f:
    ielts_vocab = json.load(f)

for item in ielts_vocab:
    iid = item["id"]
    if iid in ielts_vocab_translations:
        t = ielts_vocab_translations[iid]
        item["meaning_en"] = t["en"]
        item["meaning_zh"] = t["zh"]
        item["translation_zh"] = t["trans_zh"]
    else:
        item["meaning_en"] = item["synonym"] if "synonym" in item else item["word"]
        item["meaning_zh"] = item["meaning"]
        item["translation_zh"] = item["translation"]

with open(ivocab_path, "w", encoding="utf-8") as f:
    json.dump(ielts_vocab, f, ensure_ascii=False, indent=2)

print("IELTS vocab enriched successfully.")

# Apply to IELTS idioms
iidioms_path = os.path.join(IELTS_DIR, "ielts_idioms.json")
with open(iidioms_path, "r", encoding="utf-8") as f:
    ielts_idioms = json.load(f)

for item in ielts_idioms:
    item["meaning_en"] = item["idiom"]
    item["meaning_zh"] = item["meaning"]

with open(iidioms_path, "w", encoding="utf-8") as f:
    json.dump(ielts_idioms, f, ensure_ascii=False, indent=2)

print("IELTS idioms enriched successfully.")

# Apply to IELTS grammar
igrammar_path = os.path.join(IELTS_DIR, "ielts_grammar.json")
with open(igrammar_path, "r", encoding="utf-8") as f:
    ielts_grammar = json.load(f)

for item in ielts_grammar:
    item["category_en"] = item["category"]
    item["category_zh"] = item["category"]

with open(igrammar_path, "w", encoding="utf-8") as f:
    json.dump(ielts_grammar, f, ensure_ascii=False, indent=2)

print("IELTS grammar enriched successfully.")
