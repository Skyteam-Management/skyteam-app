import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon, LucideUsers, LucideGem, LucideArrowRight } from '@lucide/angular';

@Component({
  selector: 'app-option-page',
  templateUrl: './option-page.component.html',
  imports: [RouterLink, LucideDynamicIcon],
})
export class OptionPageComponent {
  readonly Users = LucideUsers;
  readonly Gem = LucideGem;
  readonly ArrowRight = LucideArrowRight;
}
