#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🌐 다국어 마스터 퀴즈 CLI (🇨🇳 HSK 5급 & 🇬🇧 IELTS 영어)
- 언어 선택 (--lang hsk / ielts)
- 어휘, 듣기(macOS Tingting / Samantha 음성), 성어/숙어, 빈칸, 문법
- 상/중/하 난이도(-d) 및 문제 수(-n) 커스텀 지정 가능
- 스마트 반복 학습 (SRS): 맞춘 문제는 졸업(출제 제외), 틀린 문제는 다음 시도에 반복 출제
"""

import os
import sys
import json
import random
import argparse
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROGRESS_FILE = os.path.join(BASE_DIR, ".quiz_progress.json")

# HSK 파일 경로
HSK_VOCAB = os.path.join(BASE_DIR, "vocab", "hsk5_core_vocabulary.json")
HSK_COLLOC = os.path.join(BASE_DIR, "vocab", "hsk5_collocations.json")
HSK_CHENGYU = os.path.join(BASE_DIR, "vocab", "hsk5_chengyu.json")
HSK_CLOZE = os.path.join(BASE_DIR, "vocab", "hsk5_cloze.json")
HSK_GRAMMAR = os.path.join(BASE_DIR, "vocab", "hsk5_grammar.json")
HSK_LISTENING = os.path.join(BASE_DIR, "vocab", "hsk5_listening.json")
HSK_DICTATION = os.path.join(BASE_DIR, "vocab", "hsk5_dictation.json")

# IELTS 파일 경로
IELTS_VOCAB = os.path.join(BASE_DIR, "ielts", "ielts_vocab.json")
IELTS_LISTENING = os.path.join(BASE_DIR, "ielts", "ielts_listening.json")
IELTS_IDIOMS = os.path.join(BASE_DIR, "ielts", "ielts_idioms.json")
IELTS_CLOZE = os.path.join(BASE_DIR, "ielts", "ielts_cloze.json")
IELTS_GRAMMAR = os.path.join(BASE_DIR, "ielts", "ielts_grammar.json")
IELTS_DICTATION = os.path.join(BASE_DIR, "ielts", "ielts_dictation.json")

def load_json(filepath):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[경고] {filepath} 로딩 실패: {e}")
    return []

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_progress(progress):
    try:
        with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
            json.dump(progress, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[경고] 진도 저장 실패: {e}")

def get_item_key(lang, item):
    if not item:
        return ""
    main_id = item.get("id") or item.get("word") or item.get("chengyu") or item.get("idiom") or \
              (item.get("question", "")[:18]) or (item.get("sentence", "")[:18])
    return f"{lang}_{main_id}"

def update_item_progress(lang, item, is_correct):
    if not item:
        return
    key = get_item_key(lang, item)
    progress = load_progress()
    entry = progress.get(key, {"correct": 0, "wrong": 0, "status": "new"})

    if is_correct:
        entry["correct"] = entry.get("correct", 0) + 1
        entry["status"] = "mastered"  # 맞춘 문제는 마스터 (다음 시도 제외)
    else:
        entry["wrong"] = entry.get("wrong", 0) + 1
        entry["status"] = "review"    # 틀린 문제는 복습 대상 (다음 시도 우선 출제)

    progress[key] = entry
    save_progress(progress)

def filter_items_by_diff_and_srs(items, diff, count, lang):
    if not items:
        return []
    target = normalize_diff(diff)
    exact = [it for it in items if it.get("difficulty") == target]
    others = [it for it in items if it.get("difficulty") != target]

    progress = load_progress()

    def prioritize_srs(pool):
        rev, fresh, mast = [], [], []
        for it in pool:
            k = get_item_key(lang, it)
            st = progress.get(k, {}).get("status", "new")
            if st == "review":
                rev.append((it, True))
            elif st == "mastered":
                mast.append((it, False))
            else:
                fresh.append((it, False))
        random.shuffle(rev)
        random.shuffle(fresh)
        random.shuffle(mast)
        return rev + fresh + mast

    ordered = prioritize_srs(exact)
    if len(ordered) < count:
        ordered.extend(prioritize_srs(others))

    selected = ordered[:count]
    random.shuffle(selected)
    return selected

def load_all_data(lang="hsk"):
    if lang == "ielts":
        vocab = load_json(IELTS_VOCAB)
        listening = load_json(IELTS_LISTENING)
        chengyu = load_json(IELTS_IDIOMS)
        cloze = load_json(IELTS_CLOZE)
        grammar = load_json(IELTS_GRAMMAR)
        colloc = []
        return vocab, colloc, chengyu, cloze, grammar, listening
    else:
        vocab = load_json(HSK_VOCAB)
        colloc = load_json(HSK_COLLOC)
        chengyu = load_json(HSK_CHENGYU)
        cloze = load_json(HSK_CLOZE)
        grammar = load_json(HSK_GRAMMAR)
        listening = load_json(HSK_LISTENING)
        return vocab, colloc, chengyu, cloze, grammar, listening

def normalize_diff(diff):
    if not diff:
        return "중"
    d = str(diff).strip().lower()
    if d in ["하", "easy", "1", "low"]:
        return "하"
    elif d in ["상", "hard", "3", "high"]:
        return "상"
    return "중"

def play_mac_tts(text, lang="hsk"):
    try:
        clean_text = text.replace("____", " ").replace("【", "").replace("】", "")
        voice = "Tingting" if lang == "hsk" else "Samantha"
        subprocess.Popen(["say", "-v", voice, clean_text],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

def play_feedback_sound(is_correct):
    try:
        sound_name = "Hero.aiff" if is_correct else "Basso.aiff"
        path = f"/System/Library/Sounds/{sound_name}"
        if os.path.exists(path):
            subprocess.Popen(["afplay", path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

def prompt_answer(options, correct_idx, explanation="", item=None, lang="hsk"):
    for i, opt in enumerate(options, 1):
        print(f"   ({i}) {opt}")

    while True:
        try:
            user_in = input("\n👉 정답 번호 입력 (1-4, q=종료): ").strip()
            if user_in.lower() == 'q':
                return None
            if not user_in.isdigit() or int(user_in) not in range(1, len(options) + 1):
                print(f"   ⚠️ 1부터 {len(options)} 사이의 숫자를 입력해 주세요.")
                continue
            
            choice = int(user_in)
            if choice == correct_idx:
                play_feedback_sound(True)
                update_item_progress(lang, item, True)
                print("   🎉 정답입니다! (암기 완료되어 다음 시도에 출제되지 않습니다)")
                if explanation:
                    print(f"   💡 해설:\n{explanation}")
                return True
            else:
                play_feedback_sound(False)
                update_item_progress(lang, item, False)
                print(f"   ❌ 오답입니다. 정답은 ({correct_idx})번: {options[correct_idx-1]} 입니다. (복습 대상으로 등록되어 다음 시도에 다시 출제됩니다)")
                if explanation:
                    print(f"   💡 해설:\n{explanation}")
                return False
        except (KeyboardInterrupt, EOFError):
            print("\n퀴즈를 중단합니다.")
            return None

def run_vocab_quiz(vocab, count=5, diff="중", lang="hsk"):
    candidates = filter_items_by_diff_and_srs(vocab, diff, count, lang)
    score = 0
    tag = "🇨🇳 HSK 5급" if lang == "hsk" else "🇬🇧 IELTS"
    print(f"\n🎯 [{tag} 필수 어휘 퀴즈 (난이도: {normalize_diff(diff)})] 총 {len(candidates)}문제")
    print("=" * 60)

    for idx, (q, is_review) in enumerate(candidates, 1):
        d_tag = q.get('difficulty', diff)
        review_tag = " [🔁 오답 복습]" if is_review else ""
        if lang == "hsk":
            print(f"\n[문제 {idx}/{len(candidates)}] [{d_tag}]{review_tag} 다음 한자의 뜻은 무엇일까요?")
            print(f"👉 【 {q['word']} 】 (병음: {q['pinyin']} / 품사: {q['pos']})")
        else:
            print(f"\n[문제 {idx}/{len(candidates)}] [{d_tag}]{review_tag} Select the correct Korean meaning for this word:")
            print(f"👉 【 {q['word']} 】 (Part of speech: {q.get('pos','')})")
        play_mac_tts(q['word'], lang=lang)
        
        wrong_options = [w['meaning'] for w in vocab if w['meaning'] != q['meaning']]
        options = random.sample(wrong_options, min(3, len(wrong_options))) + [q['meaning']]
        random.shuffle(options)
        correct_idx = options.index(q['meaning']) + 1

        exp = f"      - 예문: {q.get('example', '')}\n      - 해석: {q.get('translation', '')}"
        result = prompt_answer(options, correct_idx, exp, item=q, lang=lang)
        if result is None:
            break
        if result:
            score += 1

    print("\n" + "=" * 60)
    print(f"🏁 어휘 퀴즈 완료! 결과: {score}/{len(candidates)} 점 ({(score/len(candidates)*100 if candidates else 0):.0f}%) [난이도: {normalize_diff(diff)}]")
    print("=" * 60)

def run_listening_quiz(listening_list, count=5, diff="중", lang="hsk"):
    candidates = filter_items_by_diff_and_srs(listening_list, diff, count, lang)
    score = 0
    tag = "🇨🇳 HSK 5급" if lang == "hsk" else "🇬🇧 IELTS"
    voice_name = "Tingting" if lang == "hsk" else "Samantha"
    print(f"\n🎧 [{tag} 실전 듣기/리스닝 퀴즈 (난이도: {normalize_diff(diff)})] 총 {len(candidates)}문제")
    print(f"🔊 시스템에서 원어민 음성({voice_name})으로 대화와 질문이 재생됩니다.")
    print("=" * 60)

    for idx, (q, is_review) in enumerate(candidates, 1):
        d_tag = q.get('difficulty', diff)
        review_tag = " [🔁 오답 복습]" if is_review else ""
        print(f"\n[문제 {idx}/{len(candidates)}] [{d_tag}]{review_tag} <{q['category']}>")
        print("🎧 [음성 재생 중...] 대화를 주의 깊게 듣고 질문에 답하세요.")
        play_mac_tts(q['audioText'], lang=lang)

        options = list(q['options'])
        random.shuffle(options)
        correct_idx = options.index(q['answer']) + 1

        dialogue_text = "\n".join([f"      • {d['speaker']}: {d['text']}" for d in q['dialogue']])
        exp = (
            f"      [📜 대화 녹취록 / Script]\n{dialogue_text}\n"
            f"      • ❓ 질문: {q['question']}\n"
            f"      [📖 한국어 번역]\n      {q['translation']}\n"
            f"      📌 출제 공략: {q['tip']}"
        )

        result = prompt_answer(options, correct_idx, exp, item=q, lang=lang)
        if result is None:
            break
        if result:
            score += 1

    print("\n" + "=" * 60)
    print(f"🏁 듣기 퀴즈 완료! 결과: {score}/{len(candidates)} 점 ({(score/len(candidates)*100 if candidates else 0):.0f}%) [난이도: {normalize_diff(diff)}]")
    print("=" * 60)

def run_chengyu_quiz(chengyu_list, count=5, diff="중", lang="hsk"):
    candidates = filter_items_by_diff_and_srs(chengyu_list, diff, count, lang)
    score = 0
    tag = "🀄 사자성어" if lang == "hsk" else "💡 IELTS Idioms"
    print(f"\n{tag} 마스터 퀴즈 (난이도: {normalize_diff(diff)}) 총 {len(candidates)}문제")
    print("=" * 60)

    for idx, (q, is_review) in enumerate(candidates, 1):
        d_tag = q.get('difficulty', diff)
        review_tag = " [🔁 오답 복습]" if is_review else ""
        if lang == "hsk":
            is_cloze = (idx % 2 == 1) and ("sentence" in q)
            if is_cloze:
                print(f"\n[문제 {idx}/{len(candidates)}] [{d_tag}]{review_tag} 다음 문맥의 빈칸 [ ____ ] 에 가장 알맞은 사자성어는?")
                print(f"👉 \"{q['sentence']}\"")
                play_mac_tts(q['sentence'], lang="hsk")
                correct_val = f"{q['chengyu']} ({q['pinyin']})"
                wrong_pool = [f"{c['chengyu']} ({c['pinyin']})" for c in chengyu_list if c['chengyu'] != q['chengyu']]
                options = random.sample(wrong_pool, min(3, len(wrong_pool))) + [correct_val]
                random.shuffle(options)
                correct_idx = options.index(correct_val) + 1
                exp = f"      - 정답 성어: {q['chengyu']} ({q['pinyin']}) — {q['meaning']}\n      - 완성 예문: {q['example']}\n      - 해석: {q.get('translation', '')}"
            else:
                print(f"\n[문제 {idx}/{len(candidates)}] [{d_tag}]{review_tag} 다음 사자성어의 의미로 올바른 것은?")
                print(f"👉 【 {q['chengyu']} 】 (병음: {q['pinyin']})")
                play_mac_tts(q['chengyu'], lang="hsk")
                correct_val = q['meaning']
                wrong_pool = [c['meaning'] for c in chengyu_list if c['meaning'] != q['meaning']]
                options = random.sample(wrong_pool, min(3, len(wrong_pool))) + [correct_val]
                random.shuffle(options)
                correct_idx = options.index(correct_val) + 1
                exp = f"      - 활용 예문: {q.get('example', '')}\n      - 해석: {q.get('translation', '')}"
        else:
            print(f"\n[문제 {idx}/{len(candidates)}] [{d_tag}]{review_tag} Choose the most appropriate idiom for the blank [ ____ ]:")
            print(f"👉 \"{q['sentence']}\"")
            play_mac_tts(q['sentence'], lang="ielts")
            correct_val = q['idiom']
            wrong_pool = [c['idiom'] for c in chengyu_list if c['idiom'] != q['idiom']]
            options = random.sample(wrong_pool, min(3, len(wrong_pool))) + [correct_val]
            random.shuffle(options)
            correct_idx = options.index(correct_val) + 1
            exp = f"      - Idiom: {q['idiom']} ({q['meaning']})\n      - Example: {q['example']}\n      - Translation: {q.get('translation','')}"

        result = prompt_answer(options, correct_idx, exp, item=q, lang=lang)
        if result is None:
            break
        if result:
            score += 1

    print("\n" + "=" * 60)
    print(f"🏁 퀴즈 완료! 결과: {score}/{len(candidates)} 점 ({(score/len(candidates)*100 if candidates else 0):.0f}%) [난이도: {normalize_diff(diff)}]")
    print("=" * 60)

def run_cloze_quiz(cloze_list, count=5, diff="중", lang="hsk"):
    candidates = filter_items_by_diff_and_srs(cloze_list, diff, count, lang)
    score = 0
    tag = "🔗 독해 搭配 빈칸" if lang == "hsk" else "🔗 IELTS Reading Collocations"
    print(f"\n[{tag} (난이도: {normalize_diff(diff)})] 총 {len(candidates)}문제")
    print("=" * 60)

    for idx, (q, is_review) in enumerate(candidates, 1):
        d_tag = q.get('difficulty', diff)
        review_tag = " [🔁 오답 복습]" if is_review else ""
        print(f"\n[문제 {idx}/{len(candidates)}] [{d_tag}]{review_tag} 문맥과 어휘 호응을 고려하여 빈칸에 들어갈 단어를 고르세요.")
        print(f"👉 \"{q['sentence']}\"")
        options = list(q['options'])
        random.shuffle(options)
        correct_idx = options.index(q['answer']) + 1
        exp = f"      - 핵심 搭配: {q['collocation']}\n      - 해석: {q['translation']}\n      - 출제 포인트: {q['explanation']}"

        result = prompt_answer(options, correct_idx, exp, item=q, lang=lang)
        if result is None:
            break
        if result:
            score += 1

    print("\n" + "=" * 60)
    print(f"🏁 빈칸 채우기 완료! 결과: {score}/{len(candidates)} 점 ({(score/len(candidates)*100 if candidates else 0):.0f}%) [난이도: {normalize_diff(diff)}]")
    print("=" * 60)

def run_grammar_quiz(grammar_list, count=5, diff="중", lang="hsk"):
    candidates = filter_items_by_diff_and_srs(grammar_list, diff, count, lang)
    score = 0
    tag = "📑 필수 문법 & 어순" if lang == "hsk" else "📑 IELTS Writing Grammar & Structure"
    print(f"\n[{tag} (난이도: {normalize_diff(diff)})] 총 {len(candidates)}문제")
    print("=" * 60)

    for idx, (q, is_review) in enumerate(candidates, 1):
        d_tag = q.get('difficulty', diff)
        review_tag = " [🔁 오답 복습]" if is_review else ""
        print(f"\n[문제 {idx}/{len(candidates)}] [{d_tag}]{review_tag} <{q['category']}>")
        print(f"{q['question']}")
        correct_val = q['options'][q['answer'] - 1] if isinstance(q['answer'], int) else q['answer']
        options = list(q['options'])
        random.shuffle(options)
        correct_idx = options.index(correct_val) + 1
        exp_lines = [f"      {q['explanation']}"]
        if q.get('example'):
            exp_lines.append(f"      - 완성 문장: {q['example']}")
        if q.get('translation'):
            exp_lines.append(f"      - 해석: {q['translation']}")
        exp = "\n".join(exp_lines)

        result = prompt_answer(options, correct_idx, exp, item=q, lang=lang)
        if result is None:
            break
        if result:
            score += 1

    print("\n" + "=" * 60)
    print(f"🏁 문법 퀴즈 완료! 결과: {score}/{len(candidates)} 점 ({(score/len(candidates)*100 if candidates else 0):.0f}%) [난이도: {normalize_diff(diff)}]")
    print("=" * 60)

def run_mixed_quiz(vocab, listening, chengyu, cloze, grammar, count=8, diff="중", lang="hsk"):
    target = normalize_diff(diff)
    tag = "🇨🇳 HSK 5급" if lang == "hsk" else "🇬🇧 IELTS"
    print(f"\n🎲 [{tag} 종합 실전 모의 테스트 (난이도: {target})] 총 {count}문제")
    print("듣기, 어휘, 성어/숙어, 독해 빈칸, 문법 문제가 종합 출제됩니다.")
    print("=" * 60)
    
    per_cat = max(2, (count + 4) // 5)
    items = []
    items.extend([("listening", it, rev) for it, rev in filter_items_by_diff_and_srs(listening, target, per_cat, lang)])
    items.extend([("vocab", it, rev) for it, rev in filter_items_by_diff_and_srs(vocab, target, per_cat, lang)])
    items.extend([("chengyu", it, rev) for it, rev in filter_items_by_diff_and_srs(chengyu, target, per_cat, lang)])
    items.extend([("cloze", it, rev) for it, rev in filter_items_by_diff_and_srs(cloze, target, per_cat, lang)])
    items.extend([("grammar", it, rev) for it, rev in filter_items_by_diff_and_srs(grammar, target, per_cat, lang)])

    random.shuffle(items)
    items = items[:count]
    score = 0

    for idx, (q_type, q, is_review) in enumerate(items, 1):
        d_tag = q.get('difficulty', target)
        review_tag = " [🔁 오답 복습]" if is_review else ""
        if q_type == "listening":
            print(f"\n[문제 {idx}/{len(items)}] [듣기 {d_tag}{review_tag} - {q['category']}] 🎧 대화를 주의 깊게 듣고 답을 고르세요.")
            play_mac_tts(q['audioText'], lang=lang)
            options = list(q['options'])
            random.shuffle(options)
            correct_idx = options.index(q['answer']) + 1
            dialogue_text = "\n".join([f"      • {d['speaker']}: {d['text']}" for d in q['dialogue']])
            exp = f"      [녹취록]\n{dialogue_text}\n      • ❓ 질문: {q['question']}\n      📌 공략: {q['tip']}"
        elif q_type == "vocab":
            print(f"\n[문제 {idx}/{len(items)}] [어휘 {d_tag}{review_tag}] 다음 단어의 뜻은? 【 {q['word']} 】")
            play_mac_tts(q['word'], lang=lang)
            wrong_options = [w['meaning'] for w in vocab if w['meaning'] != q['meaning']]
            options = random.sample(wrong_options, min(3, len(wrong_options))) + [q['meaning']]
            random.shuffle(options)
            correct_idx = options.index(q['meaning']) + 1
            exp = f"      - 예문: {q.get('example', '')}\n      - 해석: {q.get('translation', '')}"
        elif q_type == "chengyu":
            if lang == "hsk":
                print(f"\n[문제 {idx}/{len(items)}] [사자성어 {d_tag}{review_tag}] 빈칸 [ ____ ] 에 알맞은 성어는?\n👉 \"{q['sentence']}\"")
                play_mac_tts(q['sentence'], lang="hsk")
                correct_val = f"{q['chengyu']} ({q['pinyin']})"
                wrong_pool = [f"{c['chengyu']} ({c['pinyin']})" for c in chengyu if c['chengyu'] != q['chengyu']]
            else:
                print(f"\n[문제 {idx}/{len(items)}] [Idiom {d_tag}{review_tag}] 빈칸 [ ____ ] 에 알맞은 숙어는?\n👉 \"{q['sentence']}\"")
                play_mac_tts(q['sentence'], lang="ielts")
                correct_val = q['idiom']
                wrong_pool = [c['idiom'] for c in chengyu if c['idiom'] != q['idiom']]
            options = random.sample(wrong_pool, min(3, len(wrong_pool))) + [correct_val]
            random.shuffle(options)
            correct_idx = options.index(correct_val) + 1
            exp = f"      - 의미: {q['meaning']} | 예문: {q['example']}"
        elif q_type == "cloze":
            print(f"\n[문제 {idx}/{len(items)}] [독해 빈칸 {d_tag}{review_tag}] 빈칸에 가장 알맞은 단어는?\n👉 \"{q['sentence']}\"")
            play_mac_tts(q['sentence'], lang=lang)
            options = list(q['options'])
            random.shuffle(options)
            correct_idx = options.index(q['answer']) + 1
            exp = f"      - 짝꿍(搭配): {q['collocation']} | 해석: {q['translation']}"
        elif q_type == "grammar":
            print(f"\n[문제 {idx}/{len(items)}] [문법 {d_tag}{review_tag} - {q['category']}]\n{q['question']}")
            correct_val = q['options'][q['answer'] - 1] if isinstance(q['answer'], int) else q['answer']
            options = list(q['options'])
            random.shuffle(options)
            correct_idx = options.index(correct_val) + 1
            exp = f"      {q['explanation']}"

        result = prompt_answer(options, correct_idx, exp, item=q, lang=lang)
        if result is None:
            break
        if result:
            score += 1

    print("\n" + "=" * 60)
    print(f"🏁 종합 모의 테스트 완료! 결과: {score}/{len(items)} 점 ({(score/len(items)*100 if items else 0):.0f}%) [난이도: {target}]")
    print("=" * 60)

def reset_cli_progress(lang="hsk"):
    lang_name = "HSK 5급" if lang == "hsk" else "IELTS 영어"
    progress = load_progress()
    prefix = f"{lang}_"
    keys_to_del = [k for k in progress if k.startswith(prefix)]
    for k in keys_to_del:
        del progress[k]
    save_progress(progress)
    print(f"✅ {lang_name} 학습 진도(마스터/오답 기록)를 성공적으로 초기화했습니다!")

def print_srs_summary(lang="hsk"):
    progress = load_progress()
    prefix = f"{lang}_"
    mastered = sum(1 for k, v in progress.items() if k.startswith(prefix) and v.get("status") == "mastered")
    review = sum(1 for k, v in progress.items() if k.startswith(prefix) and v.get("status") == "review")
    lang_name = "🇨🇳 HSK 5급" if lang == "hsk" else "🇬🇧 IELTS 영어"
    print("\n" + "=" * 60)
    print(f"🧠 [{lang_name} 스마트 반복 학습 (SRS) 현황]")
    print(f"  • 🎓 마스터 완료 (맞춘 문제, 출제 제외): {mastered}개")
    print(f"  • 🔁 집중 복습 대기 (틀린 문제, 다음 시도 우선 출제): {review}개")
    print("=" * 60)

def get_count_input(default=5):
    try:
        user_in = input(f"풀고 싶은 문제 수를 입력하세요 (기본값 {default}): ").strip()
        if not user_in:
            return default
        if user_in.isdigit() and int(user_in) > 0:
            return int(user_in)
    except Exception:
        pass
    return default

def get_diff_input(default="중"):
    try:
        user_in = input(f"난이도를 선택하세요 (1=하, 2=중, 3=상, 기본값 {default}): ").strip()
        if not user_in:
            return default
        if user_in in ["1", "하"]:
            return "하"
        elif user_in in ["3", "상"]:
            return "상"
        return "중"
    except Exception:
        pass
    return default

def run_dictation_quiz(dictation_list, count=5, diff="하", lang="hsk"):
    import re
    import difflib
    candidates = filter_items_by_diff_and_srs(dictation_list, diff, count, lang)
    score = 0
    tag = "🎙️ HSK 5급 중국어 말하기/딕테이션" if lang == "hsk" else "🎙️ IELTS 영어 스피킹/딕테이션"
    pass_threshold = 70 if diff == "하" else (75 if diff == "중" else 80)
    print(f"\n[{tag} (난이도: {normalize_diff(diff)} | 통과 기준: {pass_threshold}%↑)] 총 {len(candidates)}문제")
    print("=" * 60)

    for idx, (q, is_review) in enumerate(candidates, 1):
        d_tag = q.get("difficulty", diff)
        review_tag = " [🔁 오답 복습]" if is_review else ""
        target = q["sentence"]
        print(f"\n[문제 {idx}/{len(candidates)}] [{d_tag}]{review_tag}")
        print(f"🇰🇷 의미 힌트: {q.get('translation', '')}")
        if d_tag == "하":
            if lang == "hsk":
                clean_chars = re.sub(r"[，。！？、；：“”‘’（）().,!?;:\"'\\s]+", "", target)
                print(f"🌱 초급 가이드 ({len(clean_chars)}글자): {clean_chars[:2]} " + " ".join(["◯"] * max(0, len(clean_chars) - 2)))
            else:
                words = target.strip().split()
                print(f"🌱 초급 가이드 ({len(words)}단어): {' '.join(words[:2])} " + " ".join(["____"] * max(0, len(words) - 2)))
        elif d_tag == "중":
            print(f"🌿 중급 핵심 표현: {q.get('keyPoint') or q.get('phonetics') or ''}")
        print("🔊 원어민 음성을 재생합니다... (r=다시 듣기, h=원문/병음 힌트 보기, q=종료)")
        play_mac_tts(target, lang=lang)

        while True:
            try:
                user_in = input("🎤 들은 문장을 따라 말하거나 입력하세요: ").strip()
            except (KeyboardInterrupt, EOFError):
                return
            if user_in.lower() == "q":
                return
            if user_in.lower() == "r":
                play_mac_tts(target, lang=lang)
                continue
            if user_in.lower() == "h":
                print(f"   💡 힌트: {target} ({q.get('pinyin') or q.get('phonetics') or q.get('keyPoint', '')})")
                continue
            if not user_in:
                continue
            break

        norm_re = r"[，。！？、；：“”‘’（）().,!?;:\"'\\s-]+"
        t_clean = re.sub(norm_re, "", target).lower()
        u_clean = re.sub(norm_re, "", user_in).lower()
        ratio = round(difflib.SequenceMatcher(None, t_clean, u_clean).ratio() * 100)
        is_pass = ratio >= pass_threshold
        update_item_progress(lang, q, is_pass)

        if is_pass:
            play_feedback_sound(True)
            score += 1
            print(f"   🎉 정답(통과)입니다! (정확도: {ratio}% / 기준: {pass_threshold}%↑)")
        else:
            play_feedback_sound(False)
            print(f"   ❌ 오답입니다. (정확도: {ratio}% / 기준: {pass_threshold}%↑)")

        print(f"   🎯 정답 원문: {target}")
        print(f"   🗣️ 내 답변  : {user_in}")
        if q.get("pinyin") or q.get("phonetics"):
            print(f"   📌 발음/구문: {q.get('pinyin') or q.get('phonetics')}")

    print("\n" + "=" * 60)
    print(f"🏁 딕테이션 완료! 결과: {score}/{len(candidates)} 점 ({(score/len(candidates)*100 if candidates else 0):.0f}%)")
    print("=" * 60)


def interactive_menu():
    while True:
        print("\n" + "=" * 55)
        print("🌐  다국어 마스터 퀴즈 플랫폼 (HSK 5급 & IELTS 영어)")
        print("=" * 55)
        print(" [학습 언어 선택]")
        print(" 1. 🇨🇳 HSK 5급 중국어")
        print(" 2. 🇬🇧 IELTS 영어")
        print(" 0. 🚪 종료 (Exit)")
        print("=" * 55)

        lang_choice = input("학습할 언어를 선택하세요 (1 또는 2): ").strip()
        if lang_choice in ['0', 'q', 'exit']:
            print("학습을 종료합니다. Have a great day! 加油! 💪")
            break

        lang = "ielts" if lang_choice == "2" else "hsk"
        tag = "🇬🇧 IELTS 영어" if lang == "ielts" else "🇨🇳 HSK 5급 중국어"
        vocab, colloc, chengyu, cloze, grammar, listening = load_all_data(lang)
        dictation = load_json(IELTS_DICTATION if lang == "ielts" else HSK_DICTATION)

        print_srs_summary(lang)

        print("\n" + "-" * 55)
        print(f"🎯 {tag} 모드 메뉴")
        print("-" * 55)
        print(" 1. 🎯 필수 어휘 퀴즈")
        print(" 2. 🎧 실전 듣기/리스닝 퀴즈")
        print(f" 3. {'💡 숙어/Idioms 퀴즈' if lang == 'ielts' else '🀄 사자성어 퀴즈'}")
        print(" 4. 🔗 독해 Collocation/搭配 빈칸")
        print(" 5. 📑 문법 & 복합구문 퀴즈")
        print(" 6. 🎙️ 말하기/받아쓰기 딕테이션")
        print(" 7. 🎲 종합 실전 모의고사")
        print(" 8. 🔄 학습 진도 초기화 (마스터/오답 리셋)")
        print(" 0. ↩️ 언어 선택으로 돌아가기")
        print("-" * 55)

        choice = input("선택할 메뉴 번호를 입력하세요: ").strip()
        if choice in ['1', '2', '3', '4', '5', '6', '7']:
            d = get_diff_input("중")
            n = get_count_input(8 if choice == '7' else 5)
            if choice == '1':
                run_vocab_quiz(vocab, count=n, diff=d, lang=lang)
            elif choice == '2':
                run_listening_quiz(listening, count=n, diff=d, lang=lang)
            elif choice == '3':
                run_chengyu_quiz(chengyu_list=chengyu, count=n, diff=d, lang=lang)
            elif choice == '4':
                run_cloze_quiz(cloze_list=cloze, count=n, diff=d, lang=lang)
            elif choice == '5':
                run_grammar_quiz(grammar_list=grammar, count=n, diff=d, lang=lang)
            elif choice == '6':
                run_dictation_quiz(dictation_list=dictation, count=n, diff=d, lang=lang)
            elif choice == '7':
                run_mixed_quiz(vocab, listening, chengyu, cloze, grammar, count=n, diff=d, lang=lang)
        elif choice == '8':
            reset_cli_progress(lang)
        elif choice == '0':
            continue

def main():
    parser = argparse.ArgumentParser(description="다국어 마스터 퀴즈 CLI (HSK 5급 & IELTS)")
    parser.add_argument("-l", "--lang", choices=["hsk", "ielts", "cn", "en"], default="hsk",
                        help="학습할 언어 선택 (hsk/cn: 중국어, ielts/en: 영어 - 기본값: hsk)")
    parser.add_argument("--mode", choices=["vocab", "listening", "chengyu", "cloze", "grammar", "dictation", "mixed"],
                        help="실행할 퀴즈 모드 직접 지정")
    parser.add_argument("-n", "--count", type=int, default=5,
                        help="출제할 문제 수 지정 (기본값: 5)")
    parser.add_argument("-d", "--difficulty", choices=["하", "중", "상", "easy", "medium", "hard"], default="중",
                        help="난이도 지정 (하, 중, 상 - 기본값: 중)")
    parser.add_argument("--reset", action="store_true",
                        help="해당 언어의 마스터 및 오답 학습 진도 초기화")
    args = parser.parse_args()

    lang = "ielts" if args.lang in ["ielts", "en"] else "hsk"
    diff = normalize_diff(args.difficulty)

    if args.reset:
        reset_cli_progress(lang)
        return

    vocab, colloc, chengyu, cloze, grammar, listening = load_all_data(lang)
    dictation = load_json(IELTS_DICTATION if lang == "ielts" else HSK_DICTATION)

    if args.mode:
        if args.mode == "vocab":
            run_vocab_quiz(vocab, count=args.count, diff=diff, lang=lang)
        elif args.mode == "listening":
            run_listening_quiz(listening, count=args.count, diff=diff, lang=lang)
        elif args.mode == "chengyu":
            run_chengyu_quiz(chengyu, count=args.count, diff=diff, lang=lang)
        elif args.mode == "cloze":
            run_cloze_quiz(cloze, count=args.count, diff=diff, lang=lang)
        elif args.mode == "grammar":
            run_grammar_quiz(grammar, count=args.count, diff=diff, lang=lang)
        elif args.mode == "dictation":
            run_dictation_quiz(dictation, count=args.count, diff=diff, lang=lang)
        elif args.mode == "mixed":
            run_mixed_quiz(vocab, listening, chengyu, cloze, grammar, count=args.count, diff=diff, lang=lang)
    else:
        if sys.stdin.isatty():
            interactive_menu()
        else:
            print("비대화형 실행 모드입니다. --mode [vocab|listening|...] 인자를 지정해 주세요.")

if __name__ == "__main__":
    main()
