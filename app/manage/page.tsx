"use client";

import { useEffect, useState } from "react";
import { findPhoneme } from "@/lib/phonemes";
import {
  ApiActivity,
  ApiActivitySummary,
  ApiError,
  ApiWord,
  ActivityType,
  Difficulty,
  fetchActivities,
  fetchActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  addWord,
  updateWord,
  deleteWord,
} from "@/lib/api-client";

const BTN = "cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-none";

function ErrorBanner({ message, fields }: { message: string; fields?: Record<string, string[]> }) {
  return (
    <div
      className="rounded-md border-2 px-4 py-3 text-sm"
      style={{ borderColor: "var(--coral)", background: "var(--coral-soft)", color: "var(--ink)" }}
      role="alert"
    >
      <strong>{message}</strong>
      {fields && (
        <ul className="mt-1 list-disc list-inside">
          {Object.entries(fields).map(([field, msgs]) => (
            <li key={field}>
              {field}: {msgs.join(" ")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ManagePage() {
  const [activities, setActivities] = useState<ApiActivitySummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ApiActivity | null>(null);
  const [detailError, setDetailError] = useState<{ message: string; fields?: Record<string, string[]> } | null>(null);

  // New activity form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ActivityType>("WORDLE");
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>("NORMAL");
  const [newRows, setNewRows] = useState(10);
  const [newCols, setNewCols] = useState(10);
  const [creating, setCreating] = useState(false);

  // New word form (within selected activity)
  const [wordEnglish, setWordEnglish] = useState("");
  const [wordPhonemes, setWordPhonemes] = useState("");
  const [wordHint, setWordHint] = useState("");
  const [addingWord, setAddingWord] = useState(false);

  // Inline word editing
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editEnglish, setEditEnglish] = useState("");
  const [editPhonemes, setEditPhonemes] = useState("");
  const [editHint, setEditHint] = useState("");

  // Editing the selected activity's own settings (name, difficulty, grid size)
  const [editingActivity, setEditingActivity] = useState(false);
  const [editActName, setEditActName] = useState("");
  const [editActDifficulty, setEditActDifficulty] = useState<Difficulty>("NORMAL");
  const [editActRows, setEditActRows] = useState(10);
  const [editActCols, setEditActCols] = useState(10);
  const [savingActivity, setSavingActivity] = useState(false);

  async function reloadActivities() {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await fetchActivities();
      setActivities(data);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : "Couldn't reach the backend.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    reloadActivities();
  }, []);

  async function openActivity(id: string) {
    setSelectedId(id);
    setSelected(null);
    setDetailError(null);
    setEditingActivity(false);
    try {
      const activity = await fetchActivity(id);
      setSelected(activity);
    } catch (err) {
      setDetailError({ message: err instanceof ApiError ? err.message : "Couldn't load this activity." });
    }
  }

  async function handleCreateActivity(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setListError(null);
    try {
      const activity = await createActivity({
        name: newName,
        activityType: newType,
        difficulty: newDifficulty,
        gridRows: newType === "WORD_SEARCH" ? newRows : undefined,
        gridCols: newType === "WORD_SEARCH" ? newCols : undefined,
      });
      setNewName("");
      await reloadActivities();
      await openActivity(activity.id);
    } catch (err) {
      setListError(
        err instanceof ApiError
          ? `${err.message}${err.fields ? " " + Object.values(err.fields).flat().join(" ") : ""}`
          : "Couldn't create the activity."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteActivity(id: string) {
    if (!confirm("Delete this activity and all its words? This can't be undone.")) return;
    try {
      await deleteActivity(id);
      if (selectedId === id) {
        setSelectedId(null);
        setSelected(null);
      }
      await reloadActivities();
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : "Couldn't delete the activity.");
    }
  }

  function startEditActivity() {
    if (!selected) return;
    setEditActName(selected.name);
    setEditActDifficulty(selected.difficulty);
    setEditActRows(selected.gridRows ?? 10);
    setEditActCols(selected.gridCols ?? 10);
    setEditingActivity(true);
  }

  async function handleSaveActivitySettings(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSavingActivity(true);
    setDetailError(null);
    try {
      await updateActivity(selectedId, {
        name: editActName,
        difficulty: editActDifficulty,
        ...(selected?.activityType === "WORD_SEARCH" ? { gridRows: editActRows, gridCols: editActCols } : {}),
      });
      setEditingActivity(false);
      await openActivity(selectedId);
      await reloadActivities();
    } catch (err) {
      setDetailError(
        err instanceof ApiError
          ? { message: err.message, fields: err.fields }
          : { message: "Couldn't save activity settings." }
      );
    } finally {
      setSavingActivity(false);
    }
  }

  async function handleAddWord(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setAddingWord(true);
    setDetailError(null);
    try {
      const phonemes = wordPhonemes.trim().split(/\s+/).filter(Boolean);
      await addWord(selectedId, { english: wordEnglish, phonemes, hint: wordHint || undefined });
      setWordEnglish("");
      setWordPhonemes("");
      setWordHint("");
      await openActivity(selectedId);
      await reloadActivities();
    } catch (err) {
      setDetailError(
        err instanceof ApiError
          ? { message: err.message, fields: err.fields }
          : { message: "Couldn't add that word." }
      );
    } finally {
      setAddingWord(false);
    }
  }

  function startEditWord(word: ApiWord) {
    setEditingWordId(word.id);
    setEditEnglish(word.english);
    setEditPhonemes(word.phonemes.join(" "));
    setEditHint(word.hint ?? "");
  }

  async function handleSaveWordEdit(wordId: string) {
    if (!selectedId) return;
    setDetailError(null);
    try {
      const phonemes = editPhonemes.trim().split(/\s+/).filter(Boolean);
      await updateWord(wordId, { english: editEnglish, phonemes, hint: editHint.trim() === "" ? null : editHint.trim() });
      setEditingWordId(null);
      await openActivity(selectedId);
      await reloadActivities();
    } catch (err) {
      setDetailError(
        err instanceof ApiError
          ? { message: err.message, fields: err.fields }
          : { message: "Couldn't save that word." }
      );
    }
  }

  async function handleDeleteWord(wordId: string) {
    if (!selectedId) return;
    if (!confirm("Delete this word?")) return;
    try {
      await deleteWord(wordId);
      await openActivity(selectedId);
      await reloadActivities();
    } catch (err) {
      setDetailError(err instanceof ApiError ? { message: err.message } : { message: "Couldn't delete that word." });
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-[340px_1fr] gap-8">
      <aside className="rounded-lg border-2 p-5 h-fit" style={{ borderColor: "var(--line)" }}>
        <h1 className="font-display text-xl font-bold">Manage activities</h1>
        <p className="text-sm opacity-70 mt-1">
          Create, edit, and delete saved word lists — stored in the database, not just this
          browser tab.
        </p>

        <form onSubmit={handleCreateActivity} className="mt-6 flex flex-col gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="new-name">
              New activity name
            </label>
            <input
              id="new-name"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Term 2 — SH sounds"
              className="w-full rounded-md border-2 p-2 text-sm"
              style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1" htmlFor="new-type">
                Type
              </label>
              <select
                id="new-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value as ActivityType)}
                className="w-full rounded-md border-2 p-2 text-sm"
                style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
              >
                <option value="WORDLE">Wordle</option>
                <option value="WORD_SEARCH">Word Search</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" htmlFor="new-difficulty">
                Difficulty
              </label>
              <select
                id="new-difficulty"
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value as Difficulty)}
                className="w-full rounded-md border-2 p-2 text-sm"
                style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
              >
                <option value="EASY">Easy</option>
                <option value="NORMAL">Normal</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {newType === "WORD_SEARCH" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1" htmlFor="new-rows">
                  Rows
                </label>
                <input
                  id="new-rows"
                  type="number"
                  min={5}
                  max={20}
                  value={newRows}
                  onChange={(e) => setNewRows(Number(e.target.value) || 10)}
                  className="w-full rounded-md border-2 p-2 text-sm"
                  style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" htmlFor="new-cols">
                  Cols
                </label>
                <input
                  id="new-cols"
                  type="number"
                  min={5}
                  max={20}
                  value={newCols}
                  onChange={(e) => setNewCols(Number(e.target.value) || 10)}
                  className="w-full rounded-md border-2 p-2 text-sm"
                  style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className={`rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${BTN}`}
            style={{ background: "var(--teal)" }}
          >
            {creating ? "Creating…" : "+ Create activity"}
          </button>
        </form>

        <div className="mt-8">
          <p className="text-sm font-semibold mb-2">Saved activities</p>
          {loadingList && <p className="text-sm opacity-60">Loading…</p>}
          {listError && <ErrorBanner message={listError} />}
          {!loadingList && !listError && activities.length === 0 && (
            <p className="text-sm opacity-60">No activities yet — create one above.</p>
          )}
          <ul className="space-y-2">
            {activities.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => openActivity(a.id)}
                  className={`w-full text-left rounded-md border-2 px-3 py-2 text-sm ${BTN} ${selectedId === a.id ? "active" : ""}`}
                  style={{
                    borderColor: selectedId === a.id ? "var(--teal)" : "var(--line)",
                    background: selectedId === a.id ? "var(--teal-soft)" : "var(--surface)",
                  }}
                >
                  <div className="font-semibold">{a.name}</div>
                  <div className="opacity-60 text-xs mt-0.5">
                    {a.activityType === "WORDLE" ? "Wordle" : "Word Search"} · {a.wordCount} word
                    {a.wordCount === 1 ? "" : "s"} · {a.difficulty.toLowerCase()}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section>
        {!selectedId && (
          <p className="text-sm opacity-60 mt-10 text-center">
            Select an activity on the left, or create a new one, to manage its word list.
          </p>
        )}

        {selectedId && !selected && !detailError && <p className="text-sm opacity-60">Loading activity…</p>}
        {detailError && <ErrorBanner message={detailError.message} fields={detailError.fields} />}

        {selected && (
          <div>
            <div className="flex items-start justify-between gap-4">
              {!editingActivity ? (
                <>
                  <div>
                    <h2 className="font-display text-2xl font-bold">{selected.name}</h2>
                    <p className="text-sm opacity-70 mt-1">
                      {selected.activityType === "WORDLE" ? "Wordle" : "Word Search"} ·{" "}
                      {selected.difficulty.toLowerCase()} difficulty
                      {selected.activityType === "WORD_SEARCH" && (
                        <>
                          {" "}
                          · {selected.gridRows}×{selected.gridCols} grid
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={startEditActivity}
                      className={`rounded-md border-2 px-3 py-1.5 text-sm font-semibold ${BTN}`}
                      style={{ borderColor: "var(--line)" }}
                    >
                      Edit settings
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteActivity(selected.id)}
                      className={`rounded-md border-2 px-3 py-1.5 text-sm font-semibold ${BTN}`}
                      style={{ borderColor: "var(--coral)", color: "var(--coral)" }}
                    >
                      Delete activity
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveActivitySettings} className="w-full flex flex-col gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1" htmlFor="edit-act-name">
                      Activity name
                    </label>
                    <input
                      id="edit-act-name"
                      required
                      value={editActName}
                      onChange={(e) => setEditActName(e.target.value)}
                      className="w-full rounded-md border-2 p-2 text-sm"
                      style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-sm font-semibold mb-1" htmlFor="edit-act-difficulty">
                        Difficulty
                      </label>
                      <select
                        id="edit-act-difficulty"
                        value={editActDifficulty}
                        onChange={(e) => setEditActDifficulty(e.target.value as Difficulty)}
                        className="w-full rounded-md border-2 p-2 text-sm"
                        style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                      >
                        <option value="EASY">Easy</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>
                    {selected.activityType === "WORD_SEARCH" && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold mb-1" htmlFor="edit-act-rows">
                            Rows
                          </label>
                          <input
                            id="edit-act-rows"
                            type="number"
                            min={5}
                            max={20}
                            value={editActRows}
                            onChange={(e) => setEditActRows(Number(e.target.value) || 10)}
                            className="w-full rounded-md border-2 p-2 text-sm"
                            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1" htmlFor="edit-act-cols">
                            Cols
                          </label>
                          <input
                            id="edit-act-cols"
                            type="number"
                            min={5}
                            max={20}
                            value={editActCols}
                            onChange={(e) => setEditActCols(Number(e.target.value) || 10)}
                            className="w-full rounded-md border-2 p-2 text-sm"
                            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                          />
                        </div>
                      </>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={savingActivity}
                        className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${BTN}`}
                        style={{ background: "var(--teal)" }}
                      >
                        {savingActivity ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingActivity(false)}
                        className={`rounded-md border-2 px-3 py-2 text-sm font-semibold ${BTN}`}
                        style={{ borderColor: "var(--line)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            <h3 className="font-display text-lg font-bold mt-8">Add a word</h3>
            <form onSubmit={handleAddWord} className="mt-3 grid sm:grid-cols-[1fr_1fr_1.4fr_auto] gap-2 items-start">
              <input
                required
                value={wordEnglish}
                onChange={(e) => setWordEnglish(e.target.value)}
                placeholder="Spelling, e.g. ship"
                className="rounded-md border-2 p-2 text-sm"
                style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
              />
              <input
                required
                value={wordPhonemes}
                onChange={(e) => setWordPhonemes(e.target.value)}
                placeholder="Phonemes, e.g. ʃ ɪ p"
                className="rounded-md border-2 p-2 text-sm font-mono"
                style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
              />
              <input
                value={wordHint}
                onChange={(e) => setWordHint(e.target.value)}
                placeholder="Hint (optional)"
                className="rounded-md border-2 p-2 text-sm"
                style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
              />
              <button
                type="submit"
                disabled={addingWord}
                className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${BTN}`}
                style={{ background: "var(--teal)" }}
              >
                {addingWord ? "Adding…" : "Add"}
              </button>
            </form>

            <h3 className="font-display text-lg font-bold mt-8">
              Word list ({selected.words.length})
            </h3>
            {selected.words.length === 0 ? (
              <p className="text-sm opacity-60 mt-2">No words yet — add one above.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {selected.words.map((w) => (
                  <li
                    key={w.id}
                    className="rounded-md border-2 p-3"
                    style={{ borderColor: "var(--line)" }}
                  >
                    {editingWordId === w.id ? (
                      <div className="grid sm:grid-cols-[1fr_1fr_1.4fr_auto_auto] gap-2 items-center">
                        <input
                          value={editEnglish}
                          onChange={(e) => setEditEnglish(e.target.value)}
                          className="rounded-md border-2 p-2 text-sm"
                          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                        />
                        <input
                          value={editPhonemes}
                          onChange={(e) => setEditPhonemes(e.target.value)}
                          className="rounded-md border-2 p-2 text-sm font-mono"
                          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                        />
                        <input
                          value={editHint}
                          onChange={(e) => setEditHint(e.target.value)}
                          placeholder="Hint (optional)"
                          className="rounded-md border-2 p-2 text-sm"
                          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveWordEdit(w.id)}
                          className={`rounded-md px-3 py-2 text-sm font-semibold text-white ${BTN}`}
                          style={{ background: "var(--teal)" }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingWordId(null)}
                          className={`rounded-md border-2 px-3 py-2 text-sm font-semibold ${BTN}`}
                          style={{ borderColor: "var(--line)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <span className="font-mono font-bold">{w.english.toUpperCase()}</span>
                          <span className="ml-2 flex gap-1 inline-flex">
                            {w.phonemes.map((ipa, i) => {
                              const info = findPhoneme(ipa);
                              return (
                                <span
                                  key={i}
                                  title={info ? `/${ipa}/ as in ${info.example}` : ipa}
                                  className="font-mono text-[11px] rounded px-1.5 py-0.5"
                                  style={{ background: "var(--coral-soft)" }}
                                >
                                  {info ? info.label : ipa}
                                </span>
                              );
                            })}
                          </span>
                          {w.hint && <p className="text-xs opacity-60 mt-1">💡 {w.hint}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditWord(w)}
                            className={`rounded-md border-2 px-3 py-1.5 text-xs font-semibold ${BTN}`}
                            style={{ borderColor: "var(--line)" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWord(w.id)}
                            className={`rounded-md border-2 px-3 py-1.5 text-xs font-semibold ${BTN}`}
                            style={{ borderColor: "var(--coral)", color: "var(--coral)" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
