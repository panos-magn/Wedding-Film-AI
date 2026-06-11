
import { AIModuleConfig } from './types';

export const AI_MODULES: AIModuleConfig[] = [
  {
    id: 'shot-planning',
    title: 'Σχεδιασμός Πλάνων AI',
    icon: '📹',
    description: 'Δημιουργία κινηματογραφικών λιστών πλάνων και προτάσεων γωνίας κάμερας.',
    prompt: 'Ως κορυφαίος κινηματογραφιστής γάμων, δημιούργησε μια λεπτομερή λίστα πλάνων για έναν γάμο με το εξής στυλ: {style}. Εστίασε στην αφήγηση, τον φωτισμό και τις μοναδικές γωνίες. Συμπερίλαβε τεχνικές προδιαγραφές για την κίνηση της κάμερας. Απάντησε στα Ελληνικά.',
    inputs: [
      { key: 'specifics', label: 'Σημαντικές στιγμές για ανάδειξη', type: 'textarea' },
      { key: 'equipment', label: 'Διαθέσιμος Εξοπλισμός (Κάμερες, Φακοί)', type: 'text' }
    ]
  },
  {
    id: 'pre-after-wedding',
    title: 'Pre/After Wedding',
    icon: '🎬',
    description: 'Concepts για δημιουργικές φωτογραφήσεις/βιντεοσκοπήσεις πριν ή μετά τον γάμο.',
    prompt: 'Πρότεινε 3 μοναδικά δημιουργικά concepts για μια συνεδρία {style}. Συμπερίλαβε ιδέες για τοποθεσίες, προτάσεις ενδυμασίας και περιγραφή της "ατμόσφαιρας". Απάντησε στα Ελληνικά.',
    inputs: [
      { key: 'location_type', label: 'Επιθυμητή Ατμόσφαιρα Τοποθεσίας', type: 'select', options: ['Αστικό', 'Φύση', 'Vintage', 'Μοντέρνο', 'Minimal'] },
      { key: 'story', label: 'Σύντομη ιστορία του ζευγαριού', type: 'textarea' }
    ]
  },
  {
    id: 'storytelling',
    title: 'Βοηθός Storytelling',
    icon: '📖',
    description: 'Σχεδιασμός αφηγηματικής ροής και συναισθηματικής επίδρασης.',
    prompt: 'Σχεδίασε ένα αφηγηματικό τόξο για μια ταινία γάμου βασισμένη στο στυλ {style}. Πώς πρέπει να χτίσουμε την ένταση και τη συναισθηματική εκτόνωση; Πρότεινε σημεία για τοποθέτηση διαλόγων. Απάντησε στα Ελληνικά.',
    inputs: [
      { key: 'vibe', label: 'Συναισθηματικός Στόχος', type: 'select', options: ['Συγκινητικό', 'Υψηλή Ενέργεια', 'Ονειρικό', 'Ντοκιμαντέρ'] }
    ]
  },
  {
    id: 'scripts-vo',
    title: 'Σενάρια & Voice-over',
    icon: '✍️',
    description: 'Δημιουργία ποιητικών σεναρίων για trailers και ταινίες.',
    prompt: 'Γράψε ένα ποιητικό σενάριο voice-over 60 δευτερολέπτων για ένα trailer γάμου. Στυλ: {style}. Τόνος: Ρομαντικός και διαχρονικός. Απάντησε στα Ελληνικά.',
    inputs: [
      { key: 'notes', label: 'Αποσπάσματα λόγων ή αποφθέγματα', type: 'textarea' }
    ]
  },
  {
    id: 'editing-assistant',
    title: 'Βοηθός Μοντάζ',
    icon: '🎞️',
    description: 'Προτάσεις για transitions, ρυθμό και τεχνικό μοντάζ.',
    prompt: 'Παρουσίασε έναν οδικό χάρτη μοντάζ για μια ταινία γάμου {style}. Πρότεινε συγκεκριμένους τύπους μετάβασης (match cuts, light leaks) και ρυθμό για κάθε κεφάλαιο. Απάντησε στα Ελληνικά.',
    inputs: [
      { key: 'software', label: 'Λογισμικό Μοντάζ', type: 'text' }
    ]
  },
  {
    id: 'highlight-reel',
    title: 'Highlight Reel Gen',
    icon: '⭐',
    description: 'Εντοπισμός "wow moments" και δομή για το 3-5λεπτο edit.',
    prompt: 'Δημιούργησε μια δομή για ένα highlight reel 4 λεπτών. Πώς να συγχρονίσουμε το μοντάζ με τα beats της μουσικής για έναν γάμο {style}; Απάντησε στα Ελληνικά.',
    inputs: [
      { key: 'bpm', label: 'Ρυθμός Μουσικής/Vibe', type: 'text' }
    ]
  },
  {
    id: 'color-grading',
    title: 'Color Grading',
    icon: '🎨',
    description: 'Προτάσεις LUT και ταίριασμα κινηματογραφικής παλέτας.',
    prompt: 'Πρότεινε μια χρωματική παλέτα και στρατηγική grading για έναν γάμο {style} που γυρίστηκε στην τοποθεσία {location}. Αναφέρσου σε συγκεκριμένα film stocks. Απάντησε στα Ελληνικά.',
    inputs: [
      { key: 'lighting', label: 'Γενικές συνθήκες φωτισμού', type: 'text' }
    ]
  },
  {
    id: 'audio-music',
    title: 'Ήχος & Μουσική',
    icon: '🎵',
    description: 'Επιμέλεια μουσικών κομματιών και συμβουλές sound design.',
    prompt: 'Πρότεινε 3 διαφορετικές μουσικές κατευθύνσεις χωρίς πνευματικά δικαιώματα για έναν γάμο {style}. Συμπερίλαβε συμβουλές sound design για ήχους περιβάλλοντος. Απάντησε στα Ελληνικά.',
    inputs: [
      { key: 'genre', label: 'Προτιμώμενα Μουσικά Είδη', type: 'text' }
    ]
  },
  {
    id: 'social-media',
    title: 'Social Optimizer',
    icon: '📱',
    description: 'Λεζάντες, hashtags και στρατηγική για viral reels.',
    prompt: 'Γράψε 3 λεζάντες Instagram (μία σύντομη, μία αφηγηματική, μία τεχνική) για μια ταινία γάμου. Συμπερίλαβε trending hashtags για {style}. Απάντησε στα Ελληνικά.',
    inputs: [
      { key: 'hook', label: 'Συγκεκριμένη στιγμή για "hook"', type: 'text' }
    ]
  },
  {
    id: 'client-comm',
    title: 'Επικοινωνία Πελάτη',
    icon: '💬',
    description: 'Templates email και ερωτηματολόγια follow-up.',
    prompt: 'Σύνταξε ένα επαγγελματικό email "Sneak Peek" για το ζευγάρι {coupleNames}. Βεβαιώσου ότι ακούγεται ενθουσιώδες και θέτει προσδοκίες για την πλήρη ταινία. Απάντησε στα Ελληνικά.',
    inputs: [
      { key: 'delay', label: 'Υπάρχουν αναμενόμενες καθυστερήσεις;', type: 'text' }
    ]
  },
  {
    id: 'timeline-workflow',
    title: 'Timeline & Workflow',
    icon: '📅',
    description: 'Checklists post-production και χρονοδιαγράμματα παράδοσης.',
    prompt: 'Δημιούργησε μια βήμα-προς-βήμα ροή εργασίας post-production για ένα επαγγελματικό studio που αναλαμβάνει ένα έργο {style}. Απάντησε στα Ελληνικά.',
    inputs: [
      { key: 'urgency', label: 'Ταχύτητα Παράδοσης', type: 'select', options: ['Express', 'Κανονική', 'Χαλαρή'] }
    ]
  }
];

export const STATUS_COLORS = {
  booked: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  pre_production: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  event_day: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  editing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export const STATUS_LABELS = {
  booked: 'ΚΡΑΤΗΜΕΝΟ',
  pre_production: 'ΠΡΟ-ΠΑΡΑΓΩΓΗ',
  event_day: 'ΗΜΕΡΑ ΓΑΜΟΥ',
  editing: 'ΜΟΝΤΑΖ',
  review: 'ΑΝΑΘΕΩΡΗΣΗ',
  delivered: 'ΠΑΡΑΔΟΘΗΚΕ',
};
